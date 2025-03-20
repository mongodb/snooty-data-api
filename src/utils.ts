import { Request } from 'express';

/**
 * Checks for req-id Request Header. Returns an empty string if the header is not
 * a truthy string.
 *
 * @param req
 * @returns
 */
export const getRequestId = (req: Request) => {
  const reqId = req.headers['req-id'];
  if (!reqId) {
    return undefined;
  } else if (Array.isArray(reqId)) {
    return undefined;
  } else {
    return reqId;
  }
};

export const assertTrailingSlash = (str: string) => {
  if (str && str.match(/\/$/)) {
    return str;
  }
  return `${str}/`;
};

const STAGING_HOSTNAME = 'docs-mongodb-org-stg.s3.us-east-2.amazonaws.com';
const PROD_HOSTNAME = 'mongodb.com';

export const isPermittedOrigin = (origin: string | undefined) => {
  if (!origin) return;
  let url;
  try {
    url = new URL(origin);
  } catch (err) {
    return;
  }
  return (
    url.protocol == 'https:' &&
    (url.hostname === STAGING_HOSTNAME || url.hostname.split('.').slice(-2).join('.') === PROD_HOSTNAME)
  );
};
