import dotenv from 'dotenv';
// Configure dotenv early so env variables can be read in imported files
dotenv.config();
import { Server } from 'http';
import { setupApp } from './app';
import { close } from './services/client';
import { initiateLogger } from './services/logger';

const PORT = process.env.PORT || 3000;
const logger = initiateLogger();
let server: Server;

const startServer = async () => {
  const app = await setupApp({});
  server = app.listen(PORT, () => {
    logger.info(`Server listening on port: ${PORT}`);
  });

  server.on('error', (err) => {
    logger.error(`Server encountered the following error: ${err}`);
  });

  server.on('close', () => {
    logger.info('Server closed');
  });
};

startServer().catch((e) => {
  logger.error(`Fatal error: ${e}`);
  process.exit(1);
});

const signalHandler = async (signal: string) => {
  logger.info(`${signal} signal received`);
  await close();
  server.close();
};

const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach((signal) => {
  process.on(signal, signalHandler);
});
