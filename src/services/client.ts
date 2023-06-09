import { MongoClient } from 'mongodb';
import { createMessage, initiateLogger } from './logger';

const ATLAS_URI = process.env.ATLAS_URI ?? '';
const logger = initiateLogger();

const client = new MongoClient(ATLAS_URI);

export const connect = async () => {
  try {
    await client.connect();
    return client;
  } catch (e) {
    logger.error(createMessage(`Failed to connect to MongoClient: ${e}`));
    throw e;
  }
};

export const close = async () => {
  return client.close();
};
