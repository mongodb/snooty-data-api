import dotenv from 'dotenv';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import app from './app';

import { closeDBConnection } from './services/database';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('SIGTERM signal received');
  await closeDBConnection();
  server.close();
});
