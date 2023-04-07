import express from 'express';
import dotenv from 'dotenv';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import { findAllBuildData } from './services/database';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/:repo/:branch/documents/:buildId', async (req, res) => {
  const obj = {
    repo: req.params.repo,
    branch: req.params.branch,
    buildId: req.params.buildId,
    documents: [],
  };
  console.log(obj);

  const data = await findAllBuildData(req.params.buildId);
  res.send(data);
});

export default app;
