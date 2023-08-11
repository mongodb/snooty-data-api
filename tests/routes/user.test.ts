import { Document, MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';

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
      const res = await request(app).get(`/user/babadook/documents?updated=${timestamp}`);
      expect(res.status).toBe(200);
      const data = res.text.split('\n');
      expect(data).toMatchSnapshot();
    });

    it('should return all metadata with different projects but same branch names', async () => {
      const res = await request(app).get('/user/beepboop-metadata/documents');
      expect(res.status).toBe(200);
      const data = res.text.split('\n');

      const expectedBranchName = 'test-same-branch';
      const projects: string[] = [];
      let numSameBranch = 0;
      // Check for metadata documents of the expected branch name and ensure there
      // are different projects
      data.forEach((doc) => {
        const parsedData: Document = JSON.parse(doc);
        if (parsedData['type'] === 'metadata' && parsedData['data']['branch'] === expectedBranchName) {
          numSameBranch++;
          projects.push(parsedData['data']['project']);
        }
      });

      expect(numSameBranch).toBeGreaterThan(1);
      const uniqueProjects = new Set(projects);
      // Since we return only 1 unique project + branch + user combination, there
      // should only be 1 of each project found here. A duplicate is not desired.
      expect(projects.length).toEqual(uniqueProjects.size);
    });
  });
});
