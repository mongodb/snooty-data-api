import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { samplePageDocuments } from './sampleData/documents';
import { sampleUpdatedPageDocuments } from './sampleData/updatedDocuments';
import { sampleMetadata } from './sampleData/metadata';
import { sampleReposBranches } from './sampleData/reposBranches';
import { sampleDocsets } from './sampleData/docsets';
import sampleAssets from './sampleData/assets.json';

const loadSampleDataInCollection = async (db: Db, documents: any, collectionName: string) => {
  const collection = db.collection(collectionName);
  await collection.insertMany(documents);
};

const loadData = async () => {
  const client = new MongoClient(process.env.ATLAS_URI!);
  const db = client.db(process.env.SNOOTY_DB_NAME!);
  const poolDB = client.db(process.env.POOL_DB_NAME!);

  await loadSampleDataInCollection(db, samplePageDocuments, 'documents');
  await loadSampleDataInCollection(db, sampleUpdatedPageDocuments, 'updated_documents');
  await loadSampleDataInCollection(db, sampleMetadata, 'metadata');
  await loadSampleDataInCollection(db, sampleAssets, 'assets');
  await loadSampleDataInCollection(poolDB, sampleReposBranches, 'repos_branches');
  await loadSampleDataInCollection(poolDB, sampleDocsets, 'docsets');

  await client.close();
};

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  (global as any).__MONGOINSTANCE = instance;
  process.env.ATLAS_URI = uri.slice(0, uri.lastIndexOf('/'));
  process.env.BUILDER_USER = 'docsworker-xlarge';
  process.env.SNOOTY_DB_NAME = 'snooty_dev';
  process.env.POOL_DB_NAME = 'pool_test';
  await loadData();
}
