import express from 'express';
import { findOneMetadataByBuildId, findPagesByBuildId } from '../services/database';
import { streamData } from '../services/data-streamer';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId/documents', async (req, res, next) => {
  const { buildId } = req.params;
  try {
    const pagesCursor = await findPagesByBuildId(buildId);
    const metadataDoc = await findOneMetadataByBuildId(buildId);
    await streamData(res, pagesCursor, metadataDoc, Date.now())
  } catch (err) {
    next(err);
  }
});

export default router;
