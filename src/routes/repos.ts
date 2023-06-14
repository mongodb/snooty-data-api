import express from 'express';
import { findAllRepos } from '../services/pool';

const router = express.Router();

// Given a Snooty project name + branch combination, return all build data
// (page ASTs, metadata, assets) for that combination. This should always be the
// latest build data at time of call
router.get('/', async (req, res, next) => {
  try {
    // TODO. parse query params to transfer for filters, find options
    const data = await findAllRepos();
    res.send({ data: data });
  } catch (err) {
    next(err);
  }
});

export default router;
