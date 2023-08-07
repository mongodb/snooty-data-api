import express from 'express';
import buildsRouter from './routes/builds';
import projectsRouter from './routes/projects';
import userRouter from './routes/user';

// This router will serve as a wrapper for all actual endpoints. This is to allow
// a separate /pre-prod prefix to exist for the same endpoints for testing purposes.
const router = express.Router();

router.use('/builds', buildsRouter);
router.use('/projects', projectsRouter);
router.use('/user', userRouter);
router.use('/prod/builds', buildsRouter);
router.use('/prod/projects', projectsRouter);

export default router;
