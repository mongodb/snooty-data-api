import express from 'express';
import { findAllRepos } from '../services/pool';
import { getRequestId } from '../utils';

const router = express.Router();

// get all repo_branches route
router.get('/', async (req, res, next) => {
  try {
    const reqId = getRequestId(req);
    const data = await findAllRepos({}, reqId);
    res.send({ data: data });
  } catch (err) {
    next(err);
  }
});

export default router;
