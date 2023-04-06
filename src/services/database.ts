import { Db, MongoClient, ObjectId } from "mongodb";
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

const client = new MongoClient(ATLAS_URI, { monitorCommands:true });
let dbInstance: Db;

// For debugging purposes. TODO-3622: Remove event listeners when done?
client.on('serverOpening', () => {
  console.log('MongoDB Client - server opening');
});

client.on('serverClosed', () => {
  console.log('MongoDB Client - server closed');
});

client.on('topologyOpening', (event) => {
  console.log('MongoDB Client - topology opening');
  console.log(event);
});

client.on('topologyClosed', (event) => {
  console.log('MongoDB Client - topology closed');
  console.log(event);
});

const db = async () => {
  if (!dbInstance) {
    try {
      await client.connect();
      const dbName = process.env.DB_NAME || 'snooty_dev';
      dbInstance = client.db(dbName);
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
  }
};

export const getAllBuildData = async (buildId: string | ObjectId) => {
  const dbSession = await db();
  const id = new ObjectId(buildId);

  const query = { build_id: id };
  const documents = await dbSession.collection<PageDocument>('documents').find(query).toArray();
  const metadata = await dbSession.collection('metadata').find(query).toArray();
  console.log(documents.length);
  console.log(metadata.length);

  // An image asset will have a consistent checksum, but can have different filenames (keys),
  // even within the same repo.
  const assetData: Record<string, Set<string>> = {};
  documents.forEach((page) => {
    page.static_assets.forEach(({ checksum, key }) => {
      if (!assetData[checksum]) {
        // Data will be null for now
        assetData[checksum] = new Set();
      }
      assetData[checksum].add(key);
    });
  });

  const checksums = Object.keys(assetData);
  const assets = await dbSession.collection<AssetDocument>('assets').find({ _id: { $in: checksums } }).toArray();
  console.log(`Found assets: ${assets.length}`);
  const responseAssets: ResponseAssets = {};
  assets.forEach((asset) => {
    const checksum = asset._id;
    responseAssets[checksum] = {
      data: asset.data,
      filenames: [...assetData[checksum]],
    };
  });
  console.log(responseAssets);

  const res = {
    documents,
    metadata,
    responseAssets,
  };
  return res;
};
