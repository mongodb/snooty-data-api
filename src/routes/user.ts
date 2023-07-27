import express from 'express';
import { findLatestMetadataByProperty, findPagesByUser } from '../services/database';
import { streamData } from '../services/dataStreamer';
import { getRequestId } from '../utils';

const router = express.Router();

// Returns all build data needed for all branches of all projects for a single github user
router.get('/:githubUser/documents', async (req, res, next) => {
  const { githubUser } = req.params;
  const { updated } = req.query;

  let parsedTimestampVal;
  if (updated && typeof updated === 'string') {
    parsedTimestampVal = parseInt(updated);
  }

  const reqId = getRequestId(req);
  try {
    const metadataCursor = findLatestMetadataByProperty({ github_username: githubUser }, req, parsedTimestampVal);
    const pagesCursor = findPagesByUser(githubUser, req, parsedTimestampVal);
    await streamData(res, pagesCursor, metadataCursor, { reqId }, req);
  } catch (err) {
    next(err);
  }
});

export default router;
