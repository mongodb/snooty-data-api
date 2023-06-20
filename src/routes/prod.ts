import express from 'express';
import { docsPerBuildIdHandler } from './builds';
import { projectBranchDocsHandler, timestampDocsHandler } from './projects';

const router = express.Router();

router.get('/projects/:snootyProject/:branch/documents', projectBranchDocsHandler);

router.get('/projects/:snootyProject/:branch/documents/updated/:timestamp', timestampDocsHandler);

router.get('/builds/:buildId/documents', docsPerBuildIdHandler);

export default router;
