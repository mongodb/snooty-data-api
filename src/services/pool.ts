import { Db, Filter, FindOptions, MongoClient, WithId } from 'mongodb';
import { createMessage, initiateLogger } from './logger';
import { assertTrailingSlash } from '../utils';

/** BEGIN typing for DB */

type EnvKeyedObject = {
  prd: string;
  stg: string;
  dotcomstg: string;
  dotcomprd: string;
};

interface BranchEntry {
  name: string;
  gitBranchName: string;
  active: boolean;
  urlAliases: string[];
  [key: string]: any;
}

interface RepoDocument extends WithId<Document> {
  repoName: string;
  project: string;
  branches: BranchEntry[];
  url: EnvKeyedObject;
  prefix: EnvKeyedObject;
  search: Record<string, string>;
}

interface BranchResponse {
  gitBranchName: string;
  active: boolean;
  fullUrl: string;
}

interface RepoResponse {
  repoName: string;
  project: string;
  search: Record<string, string>;
  branches: BranchResponse[];
}

/** END typing for DB */

const ATLAS_URI = process.env.ATLAS_URI ?? '';
const REPOS_COLLECTION = 'repos_branches';
const DB_NAME = process.env.POOL_DB_NAME ?? 'pool';
const ENV_URL_KEY = (process.env.SNOOTY_ENV ?? 'dotcomprd') as keyof EnvKeyedObject;

const logger = initiateLogger();
let client: MongoClient;
let dbInstance: Db | null = null;

export const setupClient = async (mongoClient: MongoClient) => {
  client = mongoClient;
  try {
    await client.connect();
  } catch (e) {
    logger.error(createMessage(`Error while connecting client: ${e}`));
    throw e;
  }
  return client;
};

// exposes db instance
export const poolDb = async () => {
  if (dbInstance) return dbInstance;

  try {
    if (!client) {
      client = await setupClient(new MongoClient(ATLAS_URI));
    }
    dbInstance = client.db(DB_NAME);
    return dbInstance;
  } catch (e) {
    logger.error(createMessage(`Error while setting up pool db: ${e}`));
    throw e;
  }
};

export const closeDBConnection = async () => {
  await client.close();
};

export const findAllRepos = async (options: FindOptions = {}, reqId?: string) => {
  try {
    const db = await poolDb();
    const defaultSort: FindOptions = {
      sort: { repoName: 1 },
    };
    const strictOptions: FindOptions = {
      projection: {
        repoName: 1,
        project: 1,
        branches: 1,
        url: 1,
        prefix: 1,
      },
    };
    const findOptions = { ...defaultSort, ...options, ...strictOptions };
    const query: Filter<RepoDocument> = {
      repoName: { $not: new RegExp('internal') },
    };
    return db.collection<RepoDocument>(REPOS_COLLECTION).find(query, findOptions).map(mapRepos).toArray();
  } catch (e) {
    logger.error(createMessage(`Error while finding all repos: ${e}`, reqId));
    throw e;
  }
};

/** repo_branches Documents formatting utils */

const getRepoUrl = (baseUrl: string, prefix: string) => assertTrailingSlash(baseUrl) + assertTrailingSlash(prefix);

const mapBranches = (branches: BranchEntry[], fullBaseUrl: string) =>
  branches.map((branchEntry) => ({
    gitBranchName: branchEntry.gitBranchName,
    active: branchEntry.active,
    fullUrl: `${fullBaseUrl}` + (branchEntry.urlSlug ? `${branchEntry.urlSlug}` : ''),
  }));

const mapRepos = (repo: RepoDocument): RepoResponse => ({
  repoName: repo.repoName,
  project: repo.project,
  search: repo.search,
  branches: mapBranches(repo.branches, getRepoUrl(repo.url[ENV_URL_KEY], repo.prefix[ENV_URL_KEY])),
});
