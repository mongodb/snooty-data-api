import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import buildsRouter from './routes/builds';
import projectsRouter from './routes/projects';
import { setupClient } from './services/database';

interface AppSettings {
  mongoClient?: MongoClient;
}

export const setupApp = async ({ mongoClient }: AppSettings) => {
  if (mongoClient) {
    await setupClient(mongoClient);
  }

  const app = express();
  app.use('/builds', buildsRouter);
  app.use('/projects', projectsRouter);

  return app;
};
