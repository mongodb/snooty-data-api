import express from 'express';
import {
  findLatestMetadataByProjAndBranch,
  findPagesByProjAndBranch,
  findUpdatedPagesByProjAndBranch,
  findPagesByProj,
  findLatestMetadataByProj,
} from '../services/database';
import { streamData } from '../services/dataStreamer';
import { findAllRepos } from '../services/pool';
import { getRequestId } from '../utils';

type StreamDataOptions = {
  reqId: string | undefined;
  reqTimestamp?: number;
  updatedAssetsOnly?: boolean;
};

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

  const { updated } = req.query;
  let parsedUpdatedVal;
  if (updated && typeof updated === 'string') {
    parsedUpdatedVal = parseInt(updated);
    console.log({ parsedUpdatedVal });
  }

  const reqId = getRequestId(req);
  try {
    const metadataCursor = findLatestMetadataByProj(snootyProject, req, parsedUpdatedVal);
    const pagesCursor = findPagesByProj(snootyProject, req, parsedUpdatedVal);
    await streamData(res, pagesCursor, metadataCursor, { reqId }, req);
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
    const metadataCursor = findLatestMetadataByProjAndBranch(snootyProject, branch, req);

    // base methods for no query param update
    let pagesCursor = findPagesByProjAndBranch(snootyProject, branch, req);
    let streamDataOptions: StreamDataOptions = { reqId };

    if (req.query.updated && Number(req.query.updated)) {
      // reconstruct to use the logic in
      // /:snootyProject/:branch/documents/updated/:timestamp' route
      const timestamp = req.query.updated as string;
      const timestampNum = parseInt(timestamp);
      pagesCursor = findUpdatedPagesByProjAndBranch(snootyProject, branch, timestampNum, req);
      streamDataOptions = { reqId, reqTimestamp: timestampNum, updatedAssetsOnly: true };
    }
    await streamData(res, pagesCursor, metadataCursor, streamDataOptions, req);
  } catch (err) {
    next(err);
  }
});

// TODO: at a later point we plan to deprecate this route as we consolidated with the above route.
router.get('/:snootyProject/:branch/documents/updated/:timestamp', async (req, res, next) => {
  const { snootyProject, branch, timestamp } = req.params;
  const timestampNum = parseInt(timestamp);
  const reqId = getRequestId(req);
  try {
    const metadataCursor = findLatestMetadataByProjAndBranch(snootyProject, branch, req);
    const pagesCursor = findUpdatedPagesByProjAndBranch(snootyProject, branch, timestampNum, req);
    await streamData(
      res,
      pagesCursor,
      metadataCursor,
      { reqId, reqTimestamp: timestampNum, updatedAssetsOnly: true },
      req
    );
  } catch (err) {
    next(err);
  }
});

export default router;
