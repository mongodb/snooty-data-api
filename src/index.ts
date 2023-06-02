import dotenv from 'dotenv';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import { setupApp } from './app';
import { closeDBConnection } from './services/database';
import { initiateLogger } from './services/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  const app = await setupApp({});
  const logger = initiateLogger();

  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port: ${PORT}`);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    await closeDBConnection();
    server.close();
  });
};

try {
  startServer();
} catch (e) {
  console.error(`Fatal error`, e);
  process.exit(1);
}
