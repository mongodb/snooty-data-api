import express from 'express';
import { findAllBuildData } from '../services/database';

const router = express.Router();

router.get('/:buildId', async (req, res) => {
  const data = await findAllBuildData(req.params.buildId);
  res.send(data);
})

export default router;
