import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';
import { sampleReposBranches } from '../sampleData/reposBranches';

const timestamp = 1685714694420;

describe('Test user routes', () => {
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

  describe('/user/:githubUser/documents', () => {
    it('should return all metadata and pages for all branches and all projects for 1 github user: babadook', async () => {
      const res = await request(app).get('/user/babadook/documents');
      expect(res.status).toBe(200);
      const data = res.text.split('\n');
      expect(data).toMatchSnapshot();
    });

    it('should return all metadata and pages for all branches and all projects for 1 github user: docs-builder-bot', async () => {
      const res = await request(app).get('/user/docs-builder-bot/documents');
      expect(res.status).toBe(200);
      const data = res.text.split('\n');
      expect(data).toMatchSnapshot();
    });

    it('should return all data after updated query param', async () => {
      const prevBuildTime = new Date('2023-04-06T13:26:40.000Z').getTime();
      const timestamp = new Date(prevBuildTime).getTime();
      console.log(timestamp);
      const res = await request(app).get(`/user/babadook/documents?updated=${timestamp}`);
      expect(res.status).toBe(200);
      const data = res.text.split('\n');
      expect(data).toMatchSnapshot();
    });
  });
});
