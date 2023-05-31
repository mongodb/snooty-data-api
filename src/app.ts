import express, { ErrorRequestHandler } from 'express';
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

// General error handler; called at usage of next() in routes
// eslint-disable-next-line  @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(`Error Request Handler caught an error: ${err}`);
  const status = err.status || 500;
  if (res.writable && !res.headersSent) {
    res.sendStatus(status);
  } else {
    // Ensure response ends if headers were already sent
    res.end();
  }
};

export const setupApp = async ({ mongoClient }: AppSettings) => {
  if (mongoClient) {
    await setupClient(mongoClient);
  }

  const app = express();
  app.use('/builds', buildsRouter);
  app.use('/projects', projectsRouter);
  app.use(errorHandler);

  return app;
};
