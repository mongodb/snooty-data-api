import { Db, MongoClient, ObjectId } from 'mongodb';

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

let db: Db;

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
};

export const findAssetsByChecksums = (checksums: string[]) => {
  return db.collection<AssetDocument>(ASSETS_COLLECTION).find({ _id: { $in: checksums } });
};

export const findPagesByBuildId = (buildId: string | ObjectId) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  return db.collection<PageDocument>(PAGES_COLLECTION).find(query);
};

export const findPagesByProj = (project: string) => {
  const pageIdQuery = getPageIdQuery(project);
  const query = { page_id: pageIdQuery };
  return db.collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findPagesByProjAndBranch = (project: string, branch: string) => {
  const pageIdQuery = getPageIdQuery(project, branch);
  const query = { page_id: pageIdQuery };
  return db.collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findUpdatedPagesByProjAndBranch = (project: string, branch: string, timestamp: number) => {
  const pageIdQuery = getPageIdQuery(project, branch);
  const updatedAtQuery = new Date(timestamp);
  const query = { page_id: pageIdQuery, updated_at: { $gt: updatedAtQuery } };
  return db.collection<UpdatedPageDocument>(UPDATED_PAGES_COLLECTION).find(query);
};

export const findMetadataByBuildId = (buildId: string | ObjectId) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  return db.collection(METADATA_COLLECTION).find(query);
};

/**
 * Returns all metadata documents for a given project
 * @param project
 * @returns
 */
export const findLatestMetadataByProj = (project: string) => {
  const aggregationStages = [
    // Look for all metadata documents of the same project
    { $match: { project: project } },
    // Sort them so that most recent documents are first
    { $sort: { created_at: -1 } },
    // Group documents by their branch, and only embed the first doc seen
    // (or most recent, based on sorting stage)
    { $group: { _id: '$branch', doc: { $first: '$$ROOT' } } },
    // Un-embed the doc from each group
    { $replaceRoot: { newRoot: '$doc' } },
  ];
  return db.collection(METADATA_COLLECTION).aggregate(aggregationStages);
};

export const findLatestMetadataByProjAndBranch = (project: string, branch: string) => {
  const filter = { project, branch };
  return db.collection(METADATA_COLLECTION).find(filter).sort('created_at', -1).limit(1);
};
