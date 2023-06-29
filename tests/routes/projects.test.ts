import { MongoClient } from 'mongodb';
import request from 'supertest';
import { setupApp } from '../../src/app';
import { sampleMetadata } from '../sampleData/metadata';
import { sampleReposBranches } from '../sampleData/reposBranches';

const timestamp = 1685714694420;

describe('Test projects routes', () => {
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

  it('should return all external projects from the base route', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(200);
    const projects = JSON.parse(res.text)['data'];
    expect(projects.length).toBeLessThanOrEqual(sampleReposBranches.length);
    expect(projects.find((p: any) => p?.repoName === 'cloud-docs')).toBeTruthy();
    expect(projects.filter((p: any) => p?.repoName?.includes('internal'))).toHaveLength(0);
  });

  it('should return all data based on project and branch', async () => {
    const res = await request(app).get('/projects/docs/master/documents');
    expect(res.status).toBe(200);
    const data = res.text.split('\n');
    expect(data).toMatchSnapshot();
  });

  it('should return documents with 0 assets', async () => {
    const res = await request(app).get('/projects/irrelevant-docs/master/documents');
    expect(res.status).toBe(200);
    const data = res.text.split('\n');
    expect(data).toMatchSnapshot();
  });

  it('should return documents with 0 pages', async () => {
    const res = await request(app).get('/projects/no-pages/master/documents');
    expect(res.status).toBe(200);
    const data = res.text.split('\n');
    // Data should only have 2 pieces of information: timestamp and metadata
    expect(data).toHaveLength(2);
    expect(JSON.parse(data[0])).toHaveProperty('type', 'timestamp');
    expect(JSON.parse(data[1])).toHaveProperty('type', 'metadata');
  });

  it('should return documents updated after given timestamp', async () => {
    const prevBuildTime = sampleMetadata[0].created_at;
    const timestamp = new Date(prevBuildTime).getTime();
    const res = await request(app).get(`/projects/docs/master/documents/updated/${timestamp}`);
    expect(res.status).toBe(200);
    const data = res.text.split('\n');
    expect(data).toMatchSnapshot();
  });

  describe('/:snootyProject/documents', () => {
    it('should return all metadata and pages for all branches for 1 project', async () => {
      const res = await request(app).get('/projects/docs/documents');
      expect(res.status).toBe(200);
      const data = res.text.split('\n');
      expect(data).toMatchSnapshot();
    });

    it('should return all data after updated query param', async () => {
      const prevBuildTime = sampleMetadata[0].created_at;
      const timestamp = new Date(prevBuildTime).getTime();
      const res = await request(app).get(`/projects/docs/documents?updated=${timestamp}`);
      expect(res.status).toBe(200);
      const data = res.text.split('\n');
      expect(data).toMatchSnapshot();
    });
  });
});
