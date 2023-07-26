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
  isStableBranch: boolean;
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
    isStableBranch: !!branchEntry.isStableBranch,
  }));

const mapRepos = (repo: RepoDocument): RepoResponse => ({
  repoName: repo.repoName,
  project: repo.project,
  search: repo.search,
  branches: mapBranches(repo.branches, getRepoUrl(repo.url[ENV_URL_KEY], repo.prefix[ENV_URL_KEY])),
});
