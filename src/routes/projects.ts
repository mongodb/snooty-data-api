import express from 'express';
import { findLatestMetadata, findPagesByProject, findUpdatedPagesByProject } from '../services/database';
import { DataStream } from '../services/data-streamer';

const router = express.Router();

// Given a Snooty project name + branch combination, return all build data
// (page ASTs, metadata, assets) for that combination. This should always be the
// latest build data at time of call
router.get('/:snootyProject/:branch/documents', async (req, res) => {
  const { snootyProject, branch } = req.params;
  const metadataDoc = findLatestMetadata(snootyProject, branch);
  const pagesCursor = await findPagesByProject(snootyProject, branch);

  const stream = new DataStream(pagesCursor, metadataDoc);

  try {
    stream.pipe(res);
  } catch (err) {
    console.error(`Error encountered in stream pipeline: ${err}`);
  }
});

router.get('/:snootyProject/:branch/documents/updated/:timestamp', async (req, res) => {
  const { snootyProject, branch, timestamp } = req.params;
  const timestampNum = parseInt(timestamp);
  const metadataDoc = findLatestMetadata(snootyProject, branch);
  const pagesCursor = await findUpdatedPagesByProject(snootyProject, branch, timestampNum);

  const stream = new DataStream(pagesCursor, metadataDoc);

  try {
    stream.pipe(res);
  } catch (err) {
    console.error(`Error encountered in stream pipeline: ${err}`);
  }
});

export default router;
