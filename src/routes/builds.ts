import express from 'express';
import { findOneMetadataByBuildId, findPagesByBuildId } from '../services/database';
import { streamData } from '../services/dataStreamer';
import { getRequestId } from '../utils';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId/documents', async (req, res, next) => {
  const { buildId } = req.params;
  const reqId = getRequestId(req);
  try {
    const pagesCursor = await findPagesByBuildId(buildId);
    const metadataDoc = await findOneMetadataByBuildId(buildId);
    await streamData(res, pagesCursor, metadataDoc, reqId);
  } catch (err) {
    next(err);
  }
});

export default router;
