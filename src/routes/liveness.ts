import express from 'express';

const router = express.Router();

// Simple route that k8s will request in a cadence to ensure the app is live/ready
router.get('/', async (_req, res, _next) => {
  res.sendStatus(200);
});

export default router;
