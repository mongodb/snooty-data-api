import express, { RequestHandler } from 'express';
import { findLatestMetadata, findPagesByProject, findUpdatedPagesByProject } from '../services/database';
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

// Given a Snooty project name + branch combination, return all build data
// (page ASTs, metadata, assets) for that combination. This should always be the
// latest build data at time of call
export const projectBranchDocsHandler: RequestHandler = async (req, res, next) => {
  const { snootyProject, branch } = req.params;
  const reqId = getRequestId(req);
  try {
    const metadataDoc = await findLatestMetadata(snootyProject, branch, req);
    const pagesCursor = await findPagesByProject(snootyProject, branch, req);
    await streamData(res, pagesCursor, metadataDoc, { reqId }, req);
  } catch (err) {
    next(err);
  }
};
router.get('/:snootyProject/:branch/documents', projectBranchDocsHandler);

export const timestampDocsHandler: RequestHandler = async (req, res, next) => {
  const { snootyProject, branch, timestamp } = req.params;
  const timestampNum = parseInt(timestamp);
  const reqId = getRequestId(req);
  try {
    const metadataDoc = await findLatestMetadata(snootyProject, branch, req);
    const pagesCursor = await findUpdatedPagesByProject(snootyProject, branch, timestampNum, req);
    await streamData(
      res,
      pagesCursor,
      metadataDoc,
      { reqId, reqTimestamp: timestampNum, updatedAssetsOnly: true },
      req
    );
  } catch (err) {
    next(err);
  }
};
router.get('/:snootyProject/:branch/documents/updated/:timestamp', timestampDocsHandler);

export default router;
