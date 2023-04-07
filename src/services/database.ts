import { Db, MongoClient, ObjectId, WithId } from "mongodb";
import { ResponseAssets } from "../types";

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
  ast: Object;
  source: string;
  static_assets: StaticAsset[];
  build_id: ObjectId;
  created_at: Date;
}

const ATLAS_URI = process.env.ATLAS_URI || "";

let client: MongoClient;
let dbInstance: Db;

// Set up MongoClient for application
export const setupClient = async (mongoClient: MongoClient) => {
  client = mongoClient;
  await client.connect();
  const dbName = process.env.DB_NAME || 'snooty_dev';
  dbInstance = client.db(dbName);
}

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

const findAndPrepAssets = async (pages: WithId<PageDocument>[]) => {
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
  const responseAssets: ResponseAssets = {};
  if (!checksums.length) {
    return responseAssets;
  }

  // Populate binary data for every asset checksum and convert set of filenames 
  // to array for JSON compatibility
  const assets = await dbSession.collection<AssetDocument>('assets').find({ _id: { $in: checksums } }).toArray();
  console.log(`Found assets: ${assets.length}`);
  assets.forEach((asset) => {
    const checksum = asset._id;
    responseAssets[checksum] = {
      data: asset.data,
      filenames: [...assetData[checksum]],
    };
  });

  return responseAssets;
};

export const findAllBuildData = async (buildId: string | ObjectId) => {
  const dbSession = await db();
  const id = new ObjectId(buildId);

  const query = { build_id: id };
  const documents = await dbSession.collection<PageDocument>('documents').find(query).toArray();
  const metadata = await dbSession.collection('metadata').find(query).toArray();
  const responseAssets = await findAndPrepAssets(documents);

  return {
    documents,
    metadata,
    assets: responseAssets,
  };
};
