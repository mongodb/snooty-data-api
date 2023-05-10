import { Db, MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import samplePageDocuments from './sampleData/documents.json';
import sampleUpdatedPageDocuments from './sampleData/updatedDocuments.json';
import sampleMetadata from './sampleData/metadata.json';
import sampleAssets from './sampleData/assets.json';

// Replaces string build_id with ObjectId to ensure reference is accurate
// Using $oid in the json yields an actual object when inserted
const constructNewBuildIds = (docs: any) => {
  docs.forEach((doc: any) => {
    doc.build_id = new ObjectId(doc.build_id);
  });
};

const loadSampleDataInCollection = async (
  db: Db,
  documents: any,
  collectionName: string,
  constructBuildIds?: boolean
) => {
  const collection = db.collection(collectionName);
  if (constructBuildIds) {
    constructNewBuildIds(documents);
  }
  await collection.insertMany(documents);
};

const loadData = async() => {
  const client = new MongoClient(process.env.ATLAS_URI!);
  const db = client.db(process.env.SNOOTY_DB_NAME!);

  await loadSampleDataInCollection(db, samplePageDocuments, 'documents', true);
  await loadSampleDataInCollection(db, sampleUpdatedPageDocuments, 'updated_documents', true);
  await loadSampleDataInCollection(db, sampleMetadata, 'metadata', true);
  await loadSampleDataInCollection(db, sampleAssets, 'assets');

  await client.close();
};

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  (global as any).__MONGOINSTANCE = instance;
  process.env.ATLAS_URI = uri.slice(0, uri.lastIndexOf('/'));
  process.env.BUILDER_USER = 'docsworker-xlarge';
  process.env.SNOOTY_DB_NAME = 'snooty_dev';
  await loadData();
}
