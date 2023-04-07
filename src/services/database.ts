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
    console.log('MongoDB Client closed successfully');
  }
};

const findAndPrepAssets = async (pages: WithId<PageDocument>[]) => {
  const dbSession = await db();

  // An image asset will have a consistent checksum, but can have different filenames (keys),
  // even within the same repo.
  const assetData: Record<string, Set<string>> = {};
  pages.forEach((page) => {
    page.static_assets.forEach(({ checksum, key }) => {
      if (!assetData[checksum]) {
        assetData[checksum] = new Set();
      }
      assetData[checksum].add(key);
    });
  });

  // Populate binary data for every asset checksum and convert set of filenames 
  // to array for JSON compatibility
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

  return responseAssets;
};

export const findAllBuildData = async (buildId: string | ObjectId) => {
  const dbSession = await db();
  const id = new ObjectId(buildId);

  const query = { build_id: id };
  const documents = await dbSession.collection<PageDocument>('documents').find(query).toArray();
  const metadata = await dbSession.collection('metadata').find(query).toArray();
  console.log(documents.length);
  console.log(metadata.length);
  const responseAssets = await findAndPrepAssets(documents);

  return {
    documents,
    metadata,
    assets: responseAssets,
  };
};
