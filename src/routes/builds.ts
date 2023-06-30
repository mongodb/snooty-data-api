import express from 'express';
import { findMetadataByBuildId, findPagesByBuildId } from '../services/database';
import { streamData } from '../services/dataStreamer';
import { getRequestId } from '../utils';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId/documents', async (req, res, next) => {
  const { buildId } = req.params;
  const reqId = getRequestId(req);
  try {
    const pagesCursor = findPagesByBuildId(buildId, req);
    const metadataCursor = findMetadataByBuildId(buildId, req);
    await streamData(res, pagesCursor, metadataCursor, { reqId }, req);
  } catch (err) {
    next(err);
  }
});

export default router;
