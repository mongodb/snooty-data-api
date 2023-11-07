import { Db, Filter, FindOptions, MongoClient, WithId, ObjectId } from 'mongodb';
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
  isStableBranch: boolean;
  versionSelectorLabel: string;
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

interface EnvKeyedURL {
  regression: string;
  dev: string;
  prd: string;
  stg: string;
  dotcomstg: string;
  dotcomprd: string;
}

interface DocsetDocument extends WithId<Document> {
  project: string;
  prefix: EnvKeyedObject;
  url: EnvKeyedURL;
  repos: ObjectId[];
}

export interface BranchResponse {
  gitBranchName: string;
  active: boolean;
  fullUrl: string;
  isStableBranch: boolean;
}

export interface RepoResponse {
  repoName: string;
  project: string;
  search: Record<string, string>;
  branches: BranchResponse[];
}

/** END typing for DB */

const DOCSETS_COLLECTION = 'docsets';
const REPOS_COLLECTION = 'repos_branches';
const DB_NAME = process.env.POOL_DB_NAME ?? 'pool';
const ENV_URL_KEY = (process.env.SNOOTY_ENV ?? 'dotcomprd') as keyof EnvKeyedObject;

const logger = initiateLogger();
let db: Db;

// sets module's db scope
// creates a new db instance, if it doesn't already exist
export const initPoolDb = (client: MongoClient) => {
  if (db) return db;
  db = client.db(DB_NAME);
  return db;
};

export const findAllRepos = async (options: FindOptions = {}, reqId?: string) => {
  try {
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
    const query: Filter<RepoDocument> = { internalOnly: false };
    return db.collection<RepoDocument>(REPOS_COLLECTION).find(query, findOptions).map(mapRepos).toArray();
  } catch (e) {
    logger.error(createMessage(`Error while finding all repos: ${e}`, reqId));
    throw e;
  }
};

export const findAllDocsets = async (options: FindOptions = {}, reqId?: string) => {
  try {
    const defaultSort: FindOptions = {
      sort: {},
    };
    const strictOptions: FindOptions = {
      projection: {},
    };
    const findOptions = { ...defaultSort, ...options, ...strictOptions };
    const query: Filter<DocsetDocument> = { internalOnly: true };
    return db.collection<DocsetDocument>(DOCSETS_COLLECTION).find(query, findOptions).map(mapDocsets).toArray();
  } catch (e) {
    logger.error(createMessage(`Error while finding all repos: ${e}`, reqId));
    throw e;
  }
};

/** repo_branches Documents formatting utils */

const getRepoUrl = (baseUrl: string, prefix: string) => assertTrailingSlash(baseUrl) + assertTrailingSlash(prefix);

/**
 *
 * branch full url util,
 * It dynamically handling url slugs for
 * repos that have more then one version
 */
const getBranchFullUrl = (branchEntry: BranchEntry, fullBaseUrl: string, useUrlSlug = true) => {
  const urlSlug = useUrlSlug && branchEntry?.urlSlug ? branchEntry.urlSlug : '';
  return `${fullBaseUrl}${urlSlug}`;
};

const mapBranches = (branches: BranchEntry[], fullBaseUrl: string) => {
  return branches.map((branchEntry) => ({
    gitBranchName: branchEntry.gitBranchName,
    active: branchEntry.active,
    fullUrl: getBranchFullUrl(branchEntry, fullBaseUrl, branches.length > 1),
    label: branchEntry.versionSelectorLabel,
    isStableBranch: !!branchEntry.isStableBranch,
  }));
};

const mapRepos = async (repo: RepoDocument) => {
  try {
    const query: Filter<DocsetDocument> = { project: repo.project };
    const strictOptions: FindOptions = {
      projection: {
        project: 1,
        url: 1,
        prefix: 1,
      },
    };

    const repo_docset = await db
      .collection<DocsetDocument>(DOCSETS_COLLECTION)
      .find(query, strictOptions)
      .map(mapDocsets)
      .toArray();

    return {
      repoName: repo.repoName,
      project: repo.project,
      search: repo.search,
      branches: mapBranches(
        repo.branches,
        getRepoUrl(repo_docset[0].url[ENV_URL_KEY], repo_docset[0].prefix[ENV_URL_KEY])
      ),
    };
  } catch (e) {
    logger.error(createMessage(`Error while finding docsets: ${e}`));
    throw e;
  }
};

const mapDocsets = (docset: DocsetDocument) => {
  return {
    project: docset.project,
    url: docset.url,
    prefix: docset.prefix,
  };
};
