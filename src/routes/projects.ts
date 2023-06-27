import express from 'express';
import { findLatestMetadataByProjAndBranch, findPagesByProjAndBranch, findUpdatedPagesByProjAndBranch, findPagesByProj } from '../services/database';
import { streamData } from '../services/dataStreamer';
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

// Returns all build data needed for all branches for a single project
router.get('/:snootyProject/documents', async (req, res, next) => {
  const { snootyProject } = req.params;
  const reqId = getRequestId(req);
  try {
    // const metadataCursor = findLatestMetadataByProj(snootyProject);
    const pagesCursor = await findPagesByProj(snootyProject);
    await streamData(res, pagesCursor, null, { reqId });
  } catch (err) {
    next(err);
  }
});

// Given a Snooty project name + branch combination, return all build data
// (page ASTs, metadata, assets) for that combination. This should always be the
// latest build data at time of call
router.get('/:snootyProject/:branch/documents', async (req, res, next) => {
  const { snootyProject, branch } = req.params;
  const reqId = getRequestId(req);
  try {
    const metadataDoc = await findLatestMetadataByProjAndBranch(snootyProject, branch);
    const pagesCursor = await findPagesByProjAndBranch(snootyProject, branch);
    await streamData(res, pagesCursor, metadataDoc, { reqId });
  } catch (err) {
    next(err);
  }
});

router.get('/:snootyProject/:branch/documents/updated/:timestamp', async (req, res, next) => {
  const { snootyProject, branch, timestamp } = req.params;
  const timestampNum = parseInt(timestamp);
  const reqId = getRequestId(req);
  try {
    const metadataDoc = await findLatestMetadataByProjAndBranch(snootyProject, branch);
    const pagesCursor = await findUpdatedPagesByProjAndBranch(snootyProject, branch, timestampNum);
    await streamData(res, pagesCursor, metadataDoc, { reqId, reqTimestamp: timestampNum, updatedAssetsOnly: true });
  } catch (err) {
    next(err);
  }
});

export default router;
