import { MongoClient } from "mongodb";

let client: MongoClient;

beforeAll(async () => {
  if (!process.env.ATLAS_URI) {
    return;
  }
  client = new MongoClient(process.env.ATLAS_URI);
  await client.connect();
  // TODO-3622: Populate initial data
  await client.close();
});
