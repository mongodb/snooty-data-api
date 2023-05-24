import express from 'express';
import { findOneMetadataByBuildId, findPagesByBuildId } from '../services/database';
import { DataStream } from '../services/data-streamer';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId/documents', async (req, res) => {
  const { buildId } = req.params;
  const pagesCursor = await findPagesByBuildId(buildId);
  const metadataDoc = await findOneMetadataByBuildId(buildId);

  const stream = new DataStream(pagesCursor, metadataDoc);

  try {
    stream.pipe(res);    
  } catch (err) {
    console.error(`Error encountered in stream pipeline: ${err}`);
  }
});

export default router;
