import express from 'express';

const router = express.Router();

// Simple route that k8s will request in a cadence to ensure the app is live/ready
// eslint-disable-next-line  @typescript-eslint/no-unused-vars
router.get('/', async (_req, res) => {
  res.sendStatus(200);
});

export default router;
