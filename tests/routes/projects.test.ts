import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';
import sampleUpdatedPageDocuments from '../sampleData/updatedDocuments.json';

describe('Test projects routes', () => {
  // process.env.ATLAS_URI should be defined by default in globalSetup.ts
  const client = new MongoClient(process.env.ATLAS_URI!);
  let app: Express.Application;

  beforeAll(async () => {
    app = await setupApp({ mongoClient: client });
  });

  afterAll(async () => {
    await client.close();
  });

  it('should return all data based on project ID', async () => {
    const res = await request(app).get('/projects/docs/master/documents');
    expect(res.status).toBe(200);
    expect(res.body.data.documents).toHaveLength(sampleUpdatedPageDocuments.length - 2);
    expect(res.body.data.metadata).toHaveLength(1);
    expect(res.body.data.assets).toHaveLength(3);
    expect(res.body.timestamp).toBeTruthy();
  });
});
