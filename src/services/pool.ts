import { Db, FindOptions, MongoClient, WithId } from 'mongodb';
import { initiateLogger } from './logger';

/** BEGIN typing for DB */

type EnvKeyedObject = {
  prd: any;
  preprd: any;
  dotcomstg: any;
  dotcomprd: any;
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

const ATLAS_URI = process.env.ATLAS_URI || '';
const REPOS_COLLECTION = 'repos_branches';
const DB_NAME = process.env.POOL_DB_NAME || 'pool_test';

const logger = initiateLogger();
const client = new MongoClient(ATLAS_URI);
let dbInstance: Db | null = null;

// exposes db instance
export const poolDb = async () => {
  if (dbInstance) return dbInstance;

  try {
    await client.connect();
    dbInstance = client.db(DB_NAME);
    return dbInstance;
  } catch (e) {
    logger.error(`Error while connecting client: ${e}`);
    throw e;
  }
};

export const closeDBConnection = async () => {
  await client.close();
};

export const findAllRepos = async () => {
  try {
    const db = await poolDb();
    const options: FindOptions = {
      projection: {
        repoName: 1,
        project: 1,
        branches: 1,
        url: 1,
        prefix: 1,
      },
    };
    return await db.collection<RepoDocument>(REPOS_COLLECTION).find({}, options).map(mapRepos).toArray();
  } catch (e) {
    logger.error(`Error while finding all repos: ${e}`);
    throw e;
  }
};

const mapBranches = (branches: BranchEntry[], baseUrl: string, prefix: string) =>
  branches.map((branchEntry) => ({
    gitBranchName: branchEntry.gitBranchName,
    active: branchEntry.active,
    // TODO make sure base url and prefix ends in /
    fullUrl: `${baseUrl}${prefix}` + (branchEntry.urlSlug ? `/${branchEntry.urlSlug}` : ''),
  }));

const mapRepos = (repo: RepoDocument): RepoResponse => ({
  repoName: repo.repoName,
  project: repo.project,
  search: repo.search,
  // TODO: make env agnostic
  branches: mapBranches(repo.branches, repo.url.dotcomprd, repo.prefix.dotcomprd),
});
