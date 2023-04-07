import { MongoMemoryServer } from 'mongodb-memory-server';

export = async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  console.log(`uri: ${uri}`);
  (global as any).__MONGOINSTANCE = instance;
  process.env.ATLAS_URI = uri.slice(0, uri.lastIndexOf('/'));
};
