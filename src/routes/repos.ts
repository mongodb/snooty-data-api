import express from 'express';
import { findAllRepos } from '../services/pool';
import { getRequestId } from '../utils';

const router = express.Router();

// Given a Snooty project name + branch combination, return all build data
// (page ASTs, metadata, assets) for that combination. This should always be the
// latest build data at time of call
router.get('/', async (req, res, next) => {
  try {
    const reqId = getRequestId(req);
    const data = await findAllRepos({}, {}, reqId);
    res.send({ data: data });
  } catch (err) {
    next(err);
  }
});

export default router;
