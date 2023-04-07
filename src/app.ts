import express from 'express';
import dotenv from 'dotenv';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import documentsRouter from './routes/documents';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.use('/documents', documentsRouter);

export default app;
