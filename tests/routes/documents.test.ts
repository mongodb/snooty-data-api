import request from 'supertest';
import app from '../../src/app';

describe('Test documents routes', () => {
  it('should return all data based on build ID', async () => {
    const res = await request(app).get('/documents/');
  });
});
