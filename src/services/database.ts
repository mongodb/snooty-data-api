import { Db, Filter, MongoClient, ObjectId } from 'mongodb';
import { Request } from 'express';

interface StaticAsset {
  checksum: string;
  key: string;
  updated_at?: Date;
}

interface Facet {
  category: string;
  value: string;
  display_name: string;
  sub_facets?: { [key: string]: any }[];
}

export interface AssetDocument {
  _id: string;
  data: BinaryData;
}

interface PageDocument {
  _id: ObjectId;
  page_id: string;
  filename: string;
  ast: object;
  source: string;
  static_assets: StaticAsset[];
  build_id: ObjectId;
  created_at: Date;
  facets?: Facet[];
}

interface UpdatedPageDocument {
  _id: ObjectId;
  page_id: string;
  filename: string;
  ast: object;
  static_assets: StaticAsset[];
  created_at: Date;
  updated_at: Date;
  deleted: boolean;
  facets?: Facet[];
}

export type PageDocType = PageDocument | UpdatedPageDocument;

const METADATA_COLLECTION = 'metadata';
const PAGES_COLLECTION = 'documents';
const UPDATED_PAGES_COLLECTION = 'updated_documents';
const ASSETS_COLLECTION = 'assets';
const PROD_PATH = '/prod/';

let db: Db, prodDb: Db;

const getPageIdQuery = (projectName: string, branch?: string) => {
  const user = process.env.BUILDER_USER ?? 'docsworker-xlarge';
  let pageIdPrefix = `${projectName}/${user}`;
  if (branch) {
    pageIdPrefix += `/${branch}`;
  }
  return { $regex: new RegExp(`^${pageIdPrefix}/`) };
};

// sets module's db scope
// creates a new db instance, if it doesn't already exist
export const initDb = (client: MongoClient) => {
  const dbName = process.env.SNOOTY_DB_NAME ?? 'snooty_dev';
  db = client.db(dbName);
  const prodDbName = process.env.SNOOTY_PROD_DB_NAME ?? 'snooty_dev'; // prodDbName represents production deployments (vs staging)
  prodDb = client.db(prodDbName);
};

const getDb = (request: Request) => (request.baseUrl.startsWith(PROD_PATH) ? prodDb : db);

export const findAssetsByChecksums = (checksums: string[], req: Request) => {
  return getDb(req)
    .collection<AssetDocument>(ASSETS_COLLECTION)
    .find({ _id: { $in: checksums } });
};

export const findPagesByBuildId = (buildId: string | ObjectId, req: Request) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  return getDb(req).collection<PageDocument>(PAGES_COLLECTION).find(query);
};

export const findPagesByProj = (project: string, req: Request, timestamp?: number) => {
  const pageIdQuery = getPageIdQuery(project);
  const query: Filter<UpdatedPageDocument> = { page_id: pageIdQuery };
  if (timestamp) {
    const lastQuery = new Date(timestamp);
    query['updated_at'] = { $gte: lastQuery };
  }
  return getDb(req).collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findPagesByProjAndBranch = (project: string, branch: string, req: Request, timestamp?: number) => {
  const pageIdQuery = getPageIdQuery(project, branch);
  const query: Filter<UpdatedPageDocument> = { page_id: pageIdQuery };
  if (timestamp) {
    const updatedAtQuery = new Date(timestamp);
    query['updated_at'] = { $gte: updatedAtQuery };
  }
  return getDb(req).collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findUpdatedPagesByProjAndBranch = (project: string, branch: string, timestamp: number, req: Request) => {
  const pageIdQuery = getPageIdQuery(project, branch);
  const updatedAtQuery = new Date(timestamp);
  const query = { page_id: pageIdQuery, updated_at: { $gte: updatedAtQuery } };
  return getDb(req).collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findMetadataByBuildId = (buildId: string | ObjectId, req: Request) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  return getDb(req).collection(METADATA_COLLECTION).find(query);
};

/**
 * Returns all metadata documents for a given project
 * @param project
 * @param lastQuery
 * @returns
 */
export const findLatestMetadataByProperty = (filter: Filter<Document>, req: Request, timestamp?: number) => {
  if (timestamp) {
    const lastQuery = new Date(timestamp);
    // Metadata documents are only updated whenever they're marked for deletion
    // after a PR is closed, so both Date fields should be accounted for
    filter['$or'] = [{ created_at: { $gte: lastQuery } }, { updated_at: { $gte: lastQuery } }];
  }

  const aggregationStages = [
    // Look for all metadata documents that match the filter
    { $match: filter },
    // Sort them so that most recent documents are first
    { $sort: { created_at: -1 } },
    // Group documents by unique project + branch + user combination, and only
    // embed the first doc seen (or most recent, based on sorting stage)
    {
      $group: { _id: { project: '$project', branch: '$branch' }, doc: { $first: '$$ROOT' } },
    },
    // Un-embed the doc from each group
    { $replaceRoot: { newRoot: '$doc' } },
    // Arbitrarily sort results to help avoid flaky tests
    { $sort: { _id: -1 } },
  ];
  return getDb(req).collection(METADATA_COLLECTION).aggregate(aggregationStages);
};

export const findLatestMetadataByProjAndBranch = (project: string, branch: string, req: Request) => {
  const filter = { project, branch };
  return getDb(req).collection(METADATA_COLLECTION).find(filter).sort('created_at', -1).limit(1);
};
