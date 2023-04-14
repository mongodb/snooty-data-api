import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  (global as any).__MONGOINSTANCE = instance;
  process.env.ATLAS_URI = uri.slice(0, uri.lastIndexOf('/'));
  process.env.SNOOTY_DB_NAME = 'snooty_dev';
}
