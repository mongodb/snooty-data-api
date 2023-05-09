import { Db, Filter, MongoClient, ObjectId, WithId } from 'mongodb';

interface StaticAsset {
  checksum: string;
  key: string;
}

interface AssetDocument {
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

interface ResponseAsset {
  checksum: string;
  filenames: string[];
  data: BinaryData;
}

type PageDocType = PageDocument | UpdatedPageDocument;

const ATLAS_URI = process.env.ATLAS_URI || '';

let client: MongoClient;
let dbInstance: Db;

// Set up MongoClient for application
export const setupClient = async (mongoClient: MongoClient) => {
  client = mongoClient;
  await client.connect();
  const dbName = process.env.SNOOTY_DB_NAME || 'snooty_dev';
  dbInstance = client.db(dbName);
};

// Sets up the MongoClient and returns the newly created db instance, if they don't
// already exist
const db = async () => {
  if (!dbInstance) {
    try {
      await setupClient(new MongoClient(ATLAS_URI));
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  return dbInstance;
};

export const closeDBConnection = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB Client closed successfully');
  }
};

const findAndPrepAssets = async (pages: PageDocType[]) => {
  const dbSession = await db();

  // An image asset will have a consistent checksum, but can have different filenames (keys),
  // even within the same repo. This is more of an edge case and is not ideal.
  const assetData: Record<string, Set<string>> = {};
  pages.forEach((page) => {
    page.static_assets.forEach(({ checksum, key }) => {
      if (!assetData[checksum]) {
        assetData[checksum] = new Set();
      }
      assetData[checksum].add(key);
    });
  });

  const checksums = Object.keys(assetData);
  const responseAssets: ResponseAsset[] = [];
  if (!checksums.length) {
    return responseAssets;
  }

  // Populate binary data for every asset checksum and convert set of filenames
  // to array for JSON compatibility
  const assets = await dbSession
    .collection<AssetDocument>('assets')
    .find({ _id: { $in: checksums } })
    .toArray();
  assets.forEach((asset) => {
    const checksum = asset._id;
    responseAssets.push({
      checksum,
      data: asset.data,
      filenames: [...assetData[checksum]],
    });
  });

  return responseAssets;
};

const findAllBuildData = async (filter: Filter<any>, pagesColl: string) => {
  const dbSession = await db();
  const documents = await dbSession.collection<PageDocType>(pagesColl).find(filter).toArray();
  const metadata = await dbSession.collection('metadata').find(filter).toArray();
  const responseAssets = await findAndPrepAssets(documents);

  return {
    documents,
    metadata,
    assets: responseAssets,
  };
};

export const findAllBuildDataById = async (buildId: string | ObjectId) => {
  const id = new ObjectId(buildId);
  const query = { build_id: id };
  const pagesCollection = 'documents';
  return findAllBuildData(query, pagesCollection);
};

export const findAllBuildDataByProject = async (projectName: string, branch: string) => {
  const user = process.env.BUILDER_USER ?? 'docsworker-xlarge';
  const pageIdPrefix = `${projectName}/${user}/${branch}`;
  const query = { 
    page_id: { $regex: new RegExp(`^${pageIdPrefix}`) },
    deleted: false,
  };
  const pagesCollection = 'updated_documents';
  return findAllBuildData(query, pagesCollection);
};
