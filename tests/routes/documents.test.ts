import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';

describe('Test documents routes', () => {
  // process.env.ATLAS_URI should be defined by default in globalSetup.ts
  const client = new MongoClient(process.env.ATLAS_URI!);
  let app: Express.Application;

  beforeAll(async () => {
    app = await setupApp({ mongoClient: client });
  });

  afterAll(async () => {
    await client.close();
  });
  
  it('should return all data based on build ID', async () => {
    const res = await request(app).get('/documents/642ec854c38bedd45ed3d1fc');
    expect(res.status).toBe(200);
    // TODO-3622: Check that page ASTs are accurate, metadata document is accurate, 
    // and number of assets are correct
  });
});
