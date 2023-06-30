import { Db, MongoClient, ObjectId } from 'mongodb';
import { Request } from 'express';

interface StaticAsset {
  checksum: string;
  key: string;
  updated_at?: Date;
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
}

export type PageDocType = PageDocument | UpdatedPageDocument;

const METADATA_COLLECTION = 'metadata';
const PAGES_COLLECTION = 'documents';
const UPDATED_PAGES_COLLECTION = 'updated_documents';
const ASSETS_COLLECTION = 'assets';
const PROD_PATH = '/prod/';

let db: Db, prodDb: Db;

const getPageIdQuery = (projectName: string, branch: string) => {
  const user = process.env.BUILDER_USER ?? 'docsworker-xlarge';
  const pageIdPrefix = `${projectName}/${user}/${branch}`;
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

const getDb = (request: Request) => (request.baseUrl === PROD_PATH ? prodDb : db);

export const findAssetsByChecksums = async (checksums: string[], req: Request) => {
  return getDb(req)
    .collection<AssetDocument>(ASSETS_COLLECTION)
    .find({ _id: { $in: checksums } });
};

export const findPagesByBuildId = async (buildId: string | ObjectId, req: Request) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  return getDb(req).collection<PageDocument>(PAGES_COLLECTION).find(query);
};

export const findPagesByProject = async (project: string, branch: string, req: Request) => {
  const pageIdQuery = getPageIdQuery(project, branch);
  const query = { page_id: pageIdQuery };
  return getDb(req).collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findUpdatedPagesByProject = async (project: string, branch: string, timestamp: number, req: Request) => {
  const pageIdQuery = getPageIdQuery(project, branch);
  const updatedAtQuery = new Date(timestamp);
  const query = { page_id: pageIdQuery, updated_at: { $gt: updatedAtQuery } };
  return getDb(req).collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findOneMetadataByBuildId = async (buildId: string | ObjectId, req: Request) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  return getDb(req).collection(METADATA_COLLECTION).findOne(query);
};

export const findLatestMetadata = async (project: string, branch: string, req: Request) => {
  const filter = { project, branch };
  const res = await getDb(req).collection(METADATA_COLLECTION).find(filter).sort('created_at', -1).limit(1).toArray();
  if (!res || res.length !== 1) {
    return null;
  }
  return res[0];
};
