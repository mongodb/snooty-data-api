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
