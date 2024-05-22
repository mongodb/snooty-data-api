import { AbstractCursor, Document, FindCursor } from 'mongodb';
import { Request, Response } from 'express';
import { Readable } from 'stream';
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

const logDataCount = (dataType: string, count: number, reqId?: string) => {
  logger.info(createMessage(`Found ${dataType} count: ${count}`, reqId));
};

/**
 * Handles streaming data from a source stream to an output stream. The output stream is not automatically ended.
 *
 * @param stream The source stream for data
 * @param outputStream The pipeline to stream output to
 * @param streamType The type of data handled by the stream
 * @param reqId The request ID to correlate log messages with
 */
const handleStream = async (
  sourceStream: Readable & AsyncIterable<Document>,
  outputStream: Duplex,
  dataType: string,
  reqId?: string
) => {
  // Allow caller to determine when the output stream should finish
  sourceStream.pipe(outputStream, { end: false });

  // Wait for stream to end
  await new Promise<void>((resolve, reject) => {
    sourceStream.once('end', async () => {
      resolve();
    });

    sourceStream.once('error', async (err) => {
      logger.error(createMessage(`There was an error streaming ${dataType}: ${err}`, reqId));
      sourceStream.destroy();
      reject();
    });
  });
};

/**
 * Streams timestamp number based on when output streaming began. Clients can use this to act as a sync token
 * for when data was last requested.
 *
 * @param outputStream The pipeline to stream output to
 * @param reqId The request ID to correlate log messages with
 */
const streamTimestamp = (outputStream: Duplex, reqId?: string) => {
  const timestamp = Date.now();
  const timestampChunk = { type: 'timestamp', data: timestamp };
  logger.info(createMessage(`Returning timestamp: ${timestamp}`, reqId));
  outputStream.write(timestampChunk);
};

/**
 * Streams metadata documents from Snooty Parser build output.
 *
 * @param outputStream The pipeline to stream output to
 * @param metadataCursor The cursor used for metadata documents
 * @param reqId The request ID to correlate log messages with
 */
const streamMetadata = async (outputStream: Duplex, metadataCursor: AbstractCursor<Document>, reqId?: string) => {
  const dataType = 'metadata';
  let count = 0;

  const transform = (doc: Document) => {
    const newDoc: StreamData = {
      type: dataType,
      data: doc,
    };
    count++;
    return newDoc;
  };

  const stream = metadataCursor.stream({ transform });
  await handleStream(stream, outputStream, dataType, reqId);
  logDataCount(dataType, count, reqId);
};

/**
 * Streams page documents. Assets found on each page are tracked using `assetData`.
 *
 * @param outputStream The pipeline to stream output to
 * @param pagesCursor The cursor used for page documents
 * @param assetData A mutable mapping of asset data and its list of pages
 * @param opts Streaming options
 */
const streamPages = async (
  outputStream: Duplex,
  pagesCursor: FindCursor<PageDocType>,
  assetData: Record<string, Set<string>>,
  opts: DataStreamOptions = {}
) => {
  const { updatedAssetsOnly, reqTimestamp, reqId } = opts;
  const dataType = 'page';
  let pageCount = 0;

  const transform = (doc: PageDocType) => {
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
      type: dataType,
      data: doc,
    };
    pageCount++;
    return newDoc;
  };

  const pagesStream = pagesCursor.stream({ transform });
  await handleStream(pagesStream, outputStream, dataType, reqId);
  logDataCount(dataType, pageCount, reqId);
};

/**
 * Streams asset documents based on found asset checksums.
 *
 * @param outputStream The pipeline to stream output to
 * @param assetData A mutable mapping of asset data and its list of pages
 * @param req The original request object
 * @param reqId The request ID to correlate log messages with
 */
const streamAssets = async (
  outputStream: Duplex,
  assetData: Record<string, Set<string>>,
  req: Request,
  reqId?: string
) => {
  const dataType = 'asset';
  let assetCount = 0;

  const checksums = Object.keys(assetData);
  if (!checksums.length) {
    logDataCount(dataType, assetCount, reqId);
    return;
  }

  const assetsCursor = findAssetsByChecksums(checksums, req);
  const transform = (doc: AssetDocument) => {
    const checksum = doc._id;
    const newDoc: StreamData = {
      type: dataType,
      data: {
        checksum,
        assetData: doc.data,
        filenames: [...assetData[checksum]],
      },
    };
    assetCount++;
    return newDoc;
  };

  const assetStream = assetsCursor.stream({ transform });
  await handleStream(assetStream, outputStream, dataType, reqId);
  logDataCount(dataType, assetCount, reqId);
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
 * @param metadataCursor
 * @param opts
 * @param req
 */
export const streamData = async (
  res: Response,
  pagesCursor: FindCursor<PageDocType>,
  metadataCursor: AbstractCursor<Document>,
  opts: DataStreamOptions = {},
  req: Request
) => {
  const { reqId } = opts;
  const outputStream = chain([stringer(), res]);
  // Mutable mapping to track what assets are used for different pages
  const assetData = {};

  streamTimestamp(outputStream, reqId);
  await streamMetadata(outputStream, metadataCursor, reqId);
  await streamPages(outputStream, pagesCursor, assetData, opts);
  // Stream this sequentially since data for assets is dependent on pages found
  await streamAssets(outputStream, assetData, req, reqId);

  outputStream.end();
};
