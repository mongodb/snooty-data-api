import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';

const timestamp = 1685714694420;

describe('Test documents routes', () => {
  // process.env.ATLAS_URI should be defined by default in globalSetup.ts
  const client = new MongoClient(process.env.ATLAS_URI!);
  let app: Express.Application;

  beforeAll(async () => {
    Date.now = jest.fn(() => timestamp);
    app = await setupApp({ mongoClient: client });
  });

  afterAll(async () => {
    await client.close();
  });

  it('should return all data based on build ID', async () => {
    const res = await request(app).get('/builds/642ec854c38bedd45ed3d1fc/documents');
    expect(res.status).toBe(200);
    const data = res.text.split('\n');
    expect(data).toMatchSnapshot();
  });
});
