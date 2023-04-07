import express from 'express';
import { findAllBuildData } from '../services/database';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId', async (req, res) => {
  const data = await findAllBuildData(req.params.buildId);
  res.send(data);
});

export default router;
