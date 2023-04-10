import { Db, MongoClient, ObjectId } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';
import samplePageDocuments from '../sampleData/documents.json';
import sampleMetadata from '../sampleData/metadata.json';
import sampleAssets from '../sampleData/assets.json';

// Replaces string build_id with ObjectId to ensure reference is accurate
// Using $oid in the json yields an actual object when inserted
const constructNewBuildIds = (docs: any) => {
  docs.forEach((doc: any) => {
    doc.build_id = new ObjectId(doc.build_id);
  });
}

const loadSampleDataInCollection = async (db: Db, documents: any, collectionName: string, constructBuildIds?: boolean) => {
  const collection = db.collection(collectionName);
  if (constructBuildIds) {
    constructNewBuildIds(documents);
  }
  await collection.insertMany(documents);
}

const loadData = async (client: MongoClient) => {
  const db = client.db('snooty_dev');
  await loadSampleDataInCollection(db, samplePageDocuments, 'documents', true);
  await loadSampleDataInCollection(db, sampleMetadata, 'metadata', true);
  await loadSampleDataInCollection(db, sampleAssets, 'assets');
}

describe('Test documents routes', () => {
  // process.env.ATLAS_URI should be defined by default in globalSetup.ts
  const client = new MongoClient(process.env.ATLAS_URI!);
  let app: Express.Application;

  beforeAll(async () => {
    app = await setupApp({ mongoClient: client });
    await loadData(client);
  });

  afterAll(async () => {
    await client.close();
  });
  
  it('should return all data based on build ID', async () => {
    const res = await request(app).get('/documents/642ec854c38bedd45ed3d1fc');
    expect(res.status).toBe(200);
    expect(res.body.data.documents).toHaveLength(3);
    expect(res.body.data.metadata).toHaveLength(1);
    expect(res.body.data.assets).toHaveLength(3);
    expect(res.body.timestamp).toBeTruthy();
  });
});
