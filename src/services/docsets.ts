import { createMessage, initiateLogger } from './logger';
import { assertTrailingSlash } from '../utils';

/** BEGIN typing for the upstream docsets API */

type EnvKeyedObject = {
  dotcomstg: string;
  dotcomprd: string;
};

/**
 * Legacy shape, as stored in pool.repos_branches / pool.docsets and currently
 * served by the Next.js docsets API. Distinguished from the new shape by the
 * presence of `branches`.
 */
interface LegacyBranchEntry {
  gitBranchName: string;
  active: boolean;
  isStableBranch: boolean;
  versionSelectorLabel: string;
  urlSlug: string | null;
  offlineUrl?: string;
  /** Snake_case in the legacy feed; the new schema renames this to eolType. */
  eol_type?: 'download' | 'link';
  /** Nullable in the legacy feed; the new schema requires a boolean. */
  noIndexing?: boolean | null;
  [key: string]: any;
}

interface LegacyDocsetEntry {
  repoName?: string;
  internalOnly?: boolean;
  project: string;
  branches: LegacyBranchEntry[];
  url: EnvKeyedObject | string;
  prefix: EnvKeyedObject | string;
  search?: Record<string, string>;
  displayName?: string;
}

/**
 * New shape, authored as TypeScript files under platform/versioning/projects/
 * in docs-mongodb-internal. Distinguished by the presence of `versions`.
 */
interface Version {
  versionName: string;
  active?: boolean;
  versionSelectorLabel?: string;
  stable?: boolean;
  noIndexing?: boolean;
  eolType?: 'download' | 'link';
  offlineUrl?: string;
}

interface Docset {
  project: string;
  displayName?: string;
  /** Single published prefix, e.g. "docs/atlas/cli". No env map. */
  prefix: string;
  search?: { categoryTitle: string; categoryName?: string };
  url?: EnvKeyedObject;
  versions: Version[];
}

type DocsetsApiEntry = LegacyDocsetEntry | Docset;

/** END typing for the upstream docsets API */

export interface BranchResponse {
  gitBranchName: string;
  active: boolean;
  fullUrl: string;
  label: string;
  isStableBranch: boolean;
  offlineUrl?: string;
}

export interface RepoResponse {
  displayName?: string;
  repoName?: string;
  project: string;
  search?: Record<string, string>;
  branches: BranchResponse[];
}

// Only the dotcom hosts are supported. The legacy feed also carries prd/stg/dev/
// regression keys, but a value outside this set silently resolved to an empty
// base URL and produced "//" links, so an unknown value is a hard error.
const VALID_ENV_KEYS: (keyof EnvKeyedObject)[] = ['dotcomprd', 'dotcomstg'];

// Read at call time rather than module load: dotenv.config() runs after module
// evaluation, so a module-level read can miss values coming from .env.
const envUrlKey = (): keyof EnvKeyedObject => {
  const key = process.env.SNOOTY_ENV ?? 'dotcomprd';
  if (!VALID_ENV_KEYS.includes(key as keyof EnvKeyedObject)) {
    throw new Error(`Invalid SNOOTY_ENV "${key}"; expected one of ${VALID_ENV_KEYS.join(', ')}`);
  }
  return key as keyof EnvKeyedObject;
};
const DOCSETS_API_URL = process.env.DOCSETS_API_URL;
// The upstream data changes rarely (a version cut, an EOL) and our main consumer
// polls roughly daily, so a coarse TTL keeps us close to correct while making the
// upstream irrelevant to our request path.
// Read at call time rather than module load so the values stay configurable
// without needing a module reset.
const cacheTtlMs = () => Number(process.env.DOCSETS_CACHE_TTL_MS ?? 10 * 60 * 1000);
const fetchTimeoutMs = () => Number(process.env.DOCSETS_FETCH_TIMEOUT_MS ?? 10_000);

// Versions whose name is a bare default branch are not part of the published URL.
const UNVERSIONED_NAMES = new Set(['main', 'master']);

const logger = initiateLogger();

interface Cache {
  data: RepoResponse[];
  fetchedAt: number;
}

let cache: Cache | null = null;
// Dedupes concurrent refreshes so a burst of requests triggers one upstream call.
let inFlight: Promise<RepoResponse[]> | null = null;

const getRepoUrl = (baseUrl: string, prefix: string) => assertTrailingSlash(baseUrl) + assertTrailingSlash(prefix);

const isNewSchema = (entry: DocsetsApiEntry): entry is Docset => Array.isArray((entry as Docset).versions);

/**
 * The legacy shape stores url/prefix as env-keyed maps; the new shape stores a
 * single prefix string. Accept either so the shim works against both.
 */
const resolveEnvKeyed = (value: EnvKeyedObject | string | undefined): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value[envUrlKey()] ?? '';
  return '';
};

/**
 * Whether a new-schema version's name is appended to the base URL.
 *
 * Both guards are load-bearing and reproduce the previous pool-backed behavior:
 *  - Single-version projects publish at the bare prefix, even when the version
 *    carries a name (e.g. a lone "stable"/"current" version lives at /docs/compass/,
 *    with /current/ served as a redirect). This mirrors the old
 *    `branches.length > 1` guard.
 *  - "main"/"master" are never path segments, per the versionName rule: an
 *    unversioned project uses "main" as its version name but not in its URL.
 */
const includesVersionInUrl = (versionName: string, versionCount: number) =>
  versionCount > 1 && !UNVERSIONED_NAMES.has(versionName);

const mapLegacyEntry = (entry: LegacyDocsetEntry): RepoResponse => {
  const fullBaseUrl = getRepoUrl(resolveEnvKeyed(entry.url), resolveEnvKeyed(entry.prefix));
  // Intentionally the original pool-backed rule, verbatim: the legacy path is a
  // passthrough and must not adopt the new schema's main/master handling.
  const useUrlSlug = (entry.branches ?? []).length > 1;
  const branches = (entry.branches ?? []).map((branch) => {
    const urlSlug = useUrlSlug && branch.urlSlug ? branch.urlSlug : '';
    return {
      gitBranchName: branch.gitBranchName,
      active: branch.active,
      fullUrl: `${fullBaseUrl}${urlSlug}`,
      label: branch.versionSelectorLabel,
      isStableBranch: !!branch.isStableBranch,
      offlineUrl: branch.offlineUrl,
    };
  });

  return {
    displayName: entry.displayName,
    repoName: entry.repoName,
    project: entry.project,
    search: entry.search,
    branches,
  };
};

const mapNewEntry = (entry: Docset): RepoResponse => {
  const fullBaseUrl = getRepoUrl(resolveEnvKeyed(entry.url), entry.prefix ?? '');
  const versionCount = entry.versions?.length ?? 0;

  const branches = (entry.versions ?? []).map((version) => {
    const segment = includesVersionInUrl(version.versionName, versionCount) ? version.versionName : '';
    return {
      // versionName is the content directory, the URL segment, the parser --branch
      // value, and metadata.branch in the documents DB -- so it should be exactly what
      // consumers previously read as gitBranchName.
      gitBranchName: version.versionName,
      active: version.active ?? true,
      fullUrl: `${fullBaseUrl}${segment}`,
      label: version.versionSelectorLabel ?? version.versionName,
      isStableBranch: !!version.stable,
      offlineUrl: version.offlineUrl,
    };
  });

  // categoryName defaults to the project name, but an absent `search` stays absent
  // rather than being invented.
  const search = entry.search
    ? { categoryTitle: entry.search.categoryTitle, categoryName: entry.search.categoryName ?? entry.project }
    : undefined;

  return {
    displayName: entry.displayName,
    // The new schema drops repoName entirely. The field stays in the response for
    // compatibility, mirroring the project name. Note this is a value change for
    // most projects: the legacy feed reported the GitHub repo id, so e.g. the
    // Node driver moves from "docs-node" to "node".
    repoName: entry.project,
    project: entry.project,
    search,
    branches,
  };
};

/**
 * The legacy feed still serves internal-only entries, plus docset rows that have
 * no branches at all, so both are filtered out exactly as the previous
 * pool-backed query did (`$match: { internalOnly: false }` against
 * repos_branches, which requires the field to be literally false and guarantees
 * a branches array).
 *
 * New-schema entries will carry no `internalOnly`: the docsets API will
 * serve only what belongs in the given environment, so they are all included.
 */
const isPublishedLegacyEntry = (entry: LegacyDocsetEntry) =>
  entry.internalOnly !== true && Array.isArray(entry.branches);

/**
 * A docset entry with no resolvable host should be treated as bad data.
 * Currently, the `cloud` docset has null url and prefix.
 * Treat as bad data rather than emitting it.
 */
const hasResolvableHost = (entry: DocsetsApiEntry) => !!resolveEnvKeyed(entry.url);

export const mapDocsetsResponse = (entries: DocsetsApiEntry[]): RepoResponse[] =>
  entries
    .filter((entry) => isNewSchema(entry) || isPublishedLegacyEntry(entry as LegacyDocsetEntry))
    .filter((entry) => {
      if (hasResolvableHost(entry)) return true;
      logger.warn(createMessage(`Skipping docset "${entry.project}": no resolvable url for this environment`));
      return false;
    })
    .map((entry) => (isNewSchema(entry) ? mapNewEntry(entry) : mapLegacyEntry(entry as LegacyDocsetEntry)))
    .sort((a, b) => a.project.localeCompare(b.project));

const fetchDocsets = async (reqId?: string): Promise<RepoResponse[]> => {
  if (!DOCSETS_API_URL) {
    throw new Error('Missing DOCSETS_API_URL');
  }

  // The staging docsets route is currently public. If it later moves behind
  // corpsecure, an auth header belongs here.
  const res = await fetch(DOCSETS_API_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(fetchTimeoutMs()),
  });

  if (!res.ok) {
    throw new Error(`Docsets API responded with ${res.status} ${res.statusText}`);
  }

  const body = await res.json();
  const entries: DocsetsApiEntry[] = Array.isArray(body) ? body : body?.data;

  if (!Array.isArray(entries)) {
    throw new Error('Docsets API response was not an array');
  }

  const mapped = mapDocsetsResponse(entries);

  // An empty result is always wrong here, and silently serving it would look like
  // a successful response to every consumer. Treat it as a failed fetch.
  if (!mapped.length) {
    throw new Error('Docsets API returned zero projects');
  }

  logger.info(createMessage(`Fetched ${mapped.length} projects from the docsets API`, reqId));
  return mapped;
};

const refresh = async (reqId?: string): Promise<RepoResponse[]> => {
  if (inFlight) return inFlight;
  inFlight = fetchDocsets(reqId).finally(() => {
    inFlight = null;
  });
  return inFlight;
};

export const findAllRepos = async (reqId?: string): Promise<RepoResponse[]> => {
  const isFresh = cache && Date.now() - cache.fetchedAt < cacheTtlMs();
  if (cache && isFresh) {
    return cache.data;
  }

  try {
    const data = await refresh(reqId);
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (e) {
    if (cache) {
      // Stale data beats no data: the upstream changes rarely, so a cached copy is
      // very likely still correct.
      logger.warn(
        createMessage(
          `Error refreshing docsets, serving cache from ${new Date(cache.fetchedAt).toISOString()}: ${e}`,
          reqId
        )
      );
      return cache.data;
    }
    logger.error(createMessage(`Error while finding all repos: ${e}`, reqId));
    throw e;
  }
};

/** Populates the cache at startup so the first consumer request is already warm. */
export const warmDocsetsCache = async () => {
  try {
    await findAllRepos();
  } catch (e) {
    // Deliberately non-fatal: the rest of the API does not depend on this data,
    // and the next /projects request will retry.
    logger.error(createMessage(`Failed to warm docsets cache at startup: ${e}`));
  }
};

/** Exported for tests. */
export const _resetDocsetsCache = () => {
  cache = null;
  inFlight = null;
};
