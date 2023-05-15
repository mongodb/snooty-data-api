import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';
import { sampleUpdatedPageDocuments } from '../sampleData/updatedDocuments';
import sampleMetadataDocuments from '../sampleData/metadata.json';

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

  it('should return documents updated after given timestamp', async () => {
    const prevBuildTime = sampleMetadataDocuments[0].created_at['$date'];
    const timestamp = new Date(prevBuildTime).getTime();
    const res = await request(app).get(`/projects/docs/master/documents/updated/${timestamp}`);
    expect(res.status).toBe(200);
    // Only return documents that have been updated
    expect(res.body.data.documents).toHaveLength(2);
    // Only return latest metadata document
    expect(res.body.data.metadata).toHaveLength(1);
    // Latest sample metadata document intentionally has the same creation time as the updated time
    // of the pages we want
    expect(res.body.data.documents[0].updated_at === res.body.data.metadata[0].created_at);
    // Only return assets for documents that have been updated
    expect(res.body.data.assets).toHaveLength(1);
  });
});
