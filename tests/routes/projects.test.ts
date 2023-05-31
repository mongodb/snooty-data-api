import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';
import { sampleUpdatedPageDocuments } from '../sampleData/updatedDocuments';
import sampleMetadataDocuments from '../sampleData/metadata.json';
import { parseResponse } from '../utils/parseResponse';

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
    const { pages, metadata, assets, timestamps } = parseResponse(res.text);
    expect(pages).toHaveLength(sampleUpdatedPageDocuments.length - 2);
    expect(metadata).toHaveLength(1);
    expect(assets).toHaveLength(3);
    expect(timestamps).toHaveLength(1);
  });

  it('should return documents updated after given timestamp', async () => {
    const prevBuildTime = sampleMetadataDocuments[0].created_at['$date'];
    const timestamp = new Date(prevBuildTime).getTime();
    const res = await request(app).get(`/projects/docs/master/documents/updated/${timestamp}`);
    expect(res.status).toBe(200);
    const { pages, metadata, assets, timestamps } = parseResponse(res.text);
    // Only return documents that have been updated
    expect(pages).toHaveLength(2);
    // Only return latest metadata document
    expect(metadata).toHaveLength(1);
    // Latest sample metadata document intentionally has the same creation time as the updated time
    // of the pages we want
    expect(pages[0].data.updated_at === metadata[0].data.created_at);
    // Only return assets for documents that have been updated
    expect(assets).toHaveLength(1);
    expect(timestamps).toHaveLength(1);
  });
});
