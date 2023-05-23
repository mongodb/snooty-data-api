import express from 'express';
import { findOneMetadataByBuildId, findPagesByBuildId, findAllBuildDataById } from '../services/database';
import { DataStreamer } from '../services/data-streamer';

const router = express.Router();

// Given a buildId corresponding to a persistence module build/upload, return all
// documents (page ASTs, metadata, assets) associated for that build
router.get('/:buildId/documents', async (req, res) => {
  const data = await findAllBuildDataById(req.params.buildId);
  res.send({ data, timestamp: Date.now() });
});

router.get('/:buildId/documents/test', async (req, res) => {
  // const data = await findAllBuildDataById(req.params.buildId);
  // res.send({ data, timestamp: Date.now() });

  const { buildId } = req.params;

  const pagesCursor = await findPagesByBuildId(buildId);
  const metadataDoc = await findOneMetadataByBuildId(buildId);

  const streamer = new DataStreamer(pagesCursor, metadataDoc);
  const stream = await streamer.createStream();
  console.log(stream.readableLength);
  console.log(stream.readableHighWaterMark);
  
  // pipeline(stream, res, (err) => {
  //   if (err) {
  //     console.error(err);
  //   }
  // });

  try {
    // await pipeline(stream, res);
    stream.pipe(res);
    let counter = 0;
    stream.on('data', (data) => {
      counter++;
    });

    stream.on('end', () => {
      console.log('done streaming');
      console.log(counter);
    });

    stream.on('close', () => {
      console.log('stream closed');
    });

    stream.on('error', (err) => {
      console.log('ERROR !!!');
      console.error(err);
      res.sendStatus(500);
    });
  } catch (err) {
    console.error(err);
  }
});

export default router;
