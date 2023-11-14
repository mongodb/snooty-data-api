import express from 'express';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/', async (_req, res, _next) => {
  res.sendStatus(200);
});

export default router;
