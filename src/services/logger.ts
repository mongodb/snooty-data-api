import { createLogger, Logger, transports, format } from 'winston';

let logger: Logger | null = null;

// Helper function to format JSON message
export const createMessage = (message: string, requestId?: string) => {
  return {
    message,
    reqId: requestId || null,
  };
};

export const initiateLogger = () => {
  if (logger) {
    return logger;
  }

  logger = createLogger({
    transports: [
      new transports.Console({
        format: format.json(),
      }),
    ],
  });

  logger.info('Logger created.');

  return logger;
};
