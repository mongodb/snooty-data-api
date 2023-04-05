import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/:repo/:branch/documents/:buildId', (req, res) => {
  const obj = {
    repo: req.params.repo,
    branch: req.params.branch,
    buildId: req.params.buildId,
  };
  res.send(obj);
});

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
