import { AbstractCursor, Document, FindCursor } from 'mongodb';
import { Request, Response } from 'express';
import { chain } from 'stream-chain';
import { Duplex, stringer } from 'stream-json/jsonl/Stringer';
import { AssetDocument, PageDocType, findAssetsByChecksums } from './database';
import { createMessage, initiateLogger } from './logger';
import { DataStreamOptions } from '../types';

const logger = initiateLogger();

export interface StreamData {
  type: string;
  data: any;
}


const streamAssets = async (pipeline: Duplex, assetData: Record<string, Set<string>>, req: Request, reqId?: string) => {
  const checksums = Object.keys(assetData);
  if (!checksums.length) {
    pipeline.end();
    return;
  }

  const assetsCursor = await findAssetsByChecksums(checksums, req);
  let assetCount = 0;
  const assetStream = assetsCursor.stream({
    transform(doc: AssetDocument) {
      const checksum = doc._id;
      const newDoc: StreamData = {
        type: 'asset',
        data: {
          checksum,
          assetData: doc.data,
          filenames: [...assetData[checksum]],
        },
      };
      assetCount++;
      return newDoc;
    },
  });

  // Close the stream here
  assetStream.pipe(pipeline);
  assetStream.once('end', () => {
    logger.info(createMessage(`Found ${assetCount} assets`, reqId));
  });
  assetStream.once('error', (err) => {
    logger.error(createMessage(`There was an error streaming assets: ${err}`, reqId));
    assetStream.destroy();
  });
};

const streamPages = async (
  pipeline: Duplex,
  pagesCursor: FindCursor<PageDocType>,
  req: Request,
  opts: DataStreamOptions = {}
) => {
  const assetData: Record<string, Set<string>> = {};
  let pageCount = 0;
  const { updatedAssetsOnly, reqTimestamp, reqId } = opts;
  const pagesStream = pagesCursor.stream({
    transform(doc: PageDocType) {
      // Grab static assets for each page. 1 static asset can be used on more than
      // 1 page. Due to legacy considerations, 1 image can also be referred by more
      // than 1 filename. This is suboptimal and should be changed in the future
      doc.static_assets.forEach(({ checksum, key: filename, updated_at: updatedAt }) => {
        // Skip to next asset if the asset has not been updated
        if (updatedAssetsOnly && !isUpdated(reqTimestamp, updatedAt)) {
          return;
        }
        if (!assetData[checksum]) {
          assetData[checksum] = new Set();
        }
        assetData[checksum].add(filename);
      });
      const newDoc: StreamData = {
        type: 'page',
        data: doc,
      };
      pageCount++;
      return newDoc;
    },
  });

  pagesStream.pipe(pipeline, { end: false });
  pagesStream.once('end', async () => {
    logger.info(createMessage(`Found ${pageCount} pages`, reqId));
    try {
      await streamAssets(pipeline, assetData, req, reqId);
    } catch (err) {
      logger.error(createMessage(`Error trying to stream assets: ${err}`));
      pipeline.end();
      pipeline.destroy();
    }
  });
  pagesStream.once('error', (err) => {
    logger.error(createMessage(`There was an error streaming pages: ${err}`, reqId));
    pagesStream.destroy();
  });
};

/**
 * Given an update time, returns `true` if the update took place after the request time.
 *
 * @param previousTime - The timestamp used when the request was made
 * @param newTime - The datetime of the asset's last update
 */
const isUpdated = (previousTime?: number, newTime?: Date) => {
  if (!previousTime || !newTime) return false;
  return newTime.getTime() > previousTime;
};

/**
 * Creates a pipeline from build artifacts to the Express Response. Documents are
 * transformed to denote respective data types (metadata, page, asset). Pipelines should
 * pause and resume automatically as data is streamed. Memory usage should be limited
 * to the set batch size of MongoDB cursors, which determines how many documents to keep
 * in memory.
 *
 * @param res
 * @param pagesCursor
 * @param metadataDoc
 */
export const streamData = async (
  res: Response,
  pagesCursor: FindCursor<PageDocType>,
  metadataCursor: AbstractCursor<Document>,
  opts: DataStreamOptions = {},
  req: Request
) => {
  const timestamp = Date.now();
  const { reqId } = opts;

  res.once('error', (err) => {
    logger.error(createMessage(`Error with response pipeline: ${err}`, reqId));
    // Destroy streams in hopes of preventing memory leaks
    res.destroy();
  });

  // Used as a chain of streams for output
  const pipeline = chain([stringer(), res]);

  // Return timestamp to inform Gatsby Cloud when data was last queried
  const timestampChunk: StreamData = { type: 'timestamp', data: timestamp };
  logger.info(createMessage(`Returning timestamp: ${timestamp}`, reqId));
  pipeline.write(timestampChunk);

  let metadataCount = 0;
  const metadataStream = metadataCursor.stream({
    transform(doc) {
      const newDoc: StreamData = {
        type: 'metadata',
        data: doc,
      };
      metadataCount++;
      return newDoc;
    },
  });

  // We use pipe() instead of promisified pipeline() here due to weird behavior with
  // having multiple streams in the same pipeline and setting `end` to false.
  metadataStream.pipe(pipeline, { end: false });
  // Chaining sequential streams like this is not ideal
  metadataStream.once('end', async () => {
    logger.info(createMessage(`Found ${metadataCount} metadata documents`, reqId));
    try {
      await streamPages(pipeline, pagesCursor, req, opts);
    } catch (err) {
      // Don't throw error since it'll just be a fatal error. Report it
      // and end the stream since response headers could already have been
      // sent by then.
      logger.error(createMessage(`Error trying to stream pages: ${err}`));
      pipeline.end();
      pipeline.destroy();
    }
  });
  metadataStream.once('error', (err) => {
    logger.error(createMessage(`There was an error streaming metadata: ${err}`, reqId));
    metadataStream.destroy();
  });
};
