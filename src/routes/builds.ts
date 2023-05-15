import express from 'express';
import { findAllBuildDataById } from '../services/database';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId/documents', async (req, res) => {
  const data = await findAllBuildDataById(req.params.buildId);
  res.send({ data, timestamp: Date.now() });
});

export default router;
