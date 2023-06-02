import express, { ErrorRequestHandler, RequestHandler } from 'express';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import buildsRouter from './routes/builds';
import projectsRouter from './routes/projects';
import { setupClient } from './services/database';
import { createMessage, initiateLogger } from './services/logger';

interface AppSettings {
  mongoClient?: MongoClient;
}

const logger = initiateLogger();

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

const reqHandler: RequestHandler = (req, _res, next) => {
  const reqId = new ObjectId().toString();
  // Custom header specifically for a request ID. This ID will be used to track
  // logs related to the same request
  req.headers['req-id'] = reqId;
  const message = `Request for: ${req.url}`;
  logger.info(createMessage(message, reqId));
  next();
};

export const setupApp = async ({ mongoClient }: AppSettings) => {
  if (mongoClient) {
    await setupClient(mongoClient);
  }

  const app = express();
  app.use(reqHandler);
  app.use('/builds', buildsRouter);
  app.use('/projects', projectsRouter);
  app.use(errorHandler);

  return app;
};
