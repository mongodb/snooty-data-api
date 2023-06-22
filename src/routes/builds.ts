import express, { RequestHandler } from 'express';
import { findOneMetadataByBuildId, findPagesByBuildId } from '../services/database';
import { streamData } from '../services/dataStreamer';
import { getRequestId } from '../utils';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
export const docsPerBuildIdHandler: RequestHandler = async (req, res, next) => {
  const { buildId } = req.params;
  const reqId = getRequestId(req);
  try {
    const pagesCursor = await findPagesByBuildId(buildId, req);
    const metadataDoc = await findOneMetadataByBuildId(buildId, req);
    await streamData(res, pagesCursor, metadataDoc, { reqId }, req);
  } catch (err) {
    next(err);
  }
};
router.get('/:buildId/documents', docsPerBuildIdHandler);

export default router;
