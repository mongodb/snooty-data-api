import express from 'express';
import { findAllBuildDataByProject } from '../services/database';

const router = express.Router();

// Given a Snooty project name + branch combination, return all build data
// (page ASTs, metadata, assets) for that combination. This should always be the
// latest build data at time of call
router.get('/:snootyProject/:branch/documents', async (req, res) => {
  const { snootyProject, branch } = req.params;
  const data = await findAllBuildDataByProject(snootyProject, branch);
  res.send({ data, timestamp: Date.now() });
});

export default router;
