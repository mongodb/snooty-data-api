import { AbstractCursor, Document, FindCursor } from 'mongodb';
import { Request, Response } from 'express';
import { Readable } from 'stream'
import { chain } from 'stream-chain';
import { Duplex, stringer } from 'stream-json/jsonl/Stringer';
import { AssetDocument, PageDocType, StaticAsset, findAssetsByChecksums } from './database';
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
      if (!req.closed) {
        await streamAssets(pipeline, assetData, req, reqId);
      }
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

interface DocumentData {
  cursor: AbstractCursor;
  transform: (doc: Document) => Document;
  type: string;
}

export class DataStreamer {
  res: Response;
  documentData: DocumentData[] = [];
  options: DataStreamOptions;
  req: Request;
  pipeline: Duplex;
  assetData: Record<string, Set<string>> = {};

  metadataCursor: AbstractCursor<Document>;
  pagesCursor: FindCursor<PageDocType>;

  streams: (Readable & AsyncIterable<Document>)[] = [];
  cursors: AbstractCursor[];

  isStreaming: boolean = true;
  currentStream: (Readable & AsyncIterable<Document>) | null = null;

  constructor(
    res: Response,
    pagesCursor: FindCursor<PageDocType>,
    metadataCursor: AbstractCursor<Document>,
    opts: DataStreamOptions = {},
    req: Request
  ) {
    this.res = res;
    // this.documentData = [
    //   { cursor: metadataCursor, transform: this.metadataTransform, type: 'metadata' },
    //   { cursor: pagesCursor, transform: this.pageTransform, type: 'pages' },
    // ];
    this.metadataCursor = metadataCursor;
    this.pagesCursor = pagesCursor;
    this.options = opts;
    this.req = req;

    this.pipeline = chain([stringer(), res]);
    this.req.once('close', () => {
      if (this.currentStream && !this.currentStream.closed) {
        this.currentStream.emit('end');
        // Prevent other streams from starting
        this.isStreaming = false;
      }
    });

    this.cursors = [metadataCursor, pagesCursor];
  }

  cleanup() {
    this.currentStream = null;
    this.isStreaming = false;

    // for (const stream of this.streams) {
    //   if (!stream.closed) {
    //     // stream.emit('close');
    //     stream.emit('end');
    //     logger.info(createMessage('Closed stream!!!', this.options.reqId));
    //   }
    // }

    // for (const cursor of this.cursors) {
    //   if (!cursor.closed) {
    //     cursor.close().then(() => {
    //       logger.info(createMessage('Closed cursor!!!', this.options.reqId));
    //     });
    //   }
    // }
  }

  async stream() {
    this.streamTimestamp();
    await this.streamMetadata();
    await this.streamPages();
    await this.streamAssets();

    // Manually end pipeline to end stream
    this.pipeline.end();
    this.cleanup();
  }

  // Return timestamp to inform Gatsby Cloud when data was last queried
  streamTimestamp() {
    const timestamp = Date.now();
    const timestampChunk: StreamData = { type: 'timestamp', data: timestamp };
    logger.info(createMessage(`Returning timestamp: ${timestamp}`, this.options.reqId));
    this.pipeline.write(timestampChunk);
  }

  async streamMetadata() {
    if (!this.isStreaming) {
      logger.info(createMessage('Dont stream metadata', this.options.reqId));
      if (!this.metadataCursor.closed) {
        this.metadataCursor.close();
      }
      return;
    }

    const dataType = 'metadata';
    let count = 0;

    const stream = this.metadataCursor.stream({
      transform: (doc: Document) => {
        const newDoc: StreamData = {
          type: dataType,
          data: doc,
        };
        count++;
        return newDoc;
      },
    });

    await this.handleStream(stream, this.metadataCursor, dataType)
    this.logDataCount(dataType, count);
  }

  async streamPages() {
    if (!this.isStreaming) {
      logger.info(createMessage('Dont stream pages', this.options.reqId));

      if (!this.pagesCursor.closed) {
        this.pagesCursor.close();
      }
      return;
    }

    const dataType = 'page';
    let count = 0;

    const transform = (doc: PageDocType) => {
      doc.static_assets.forEach((staticAsset) => {this.addAsset(staticAsset)});
      const newDoc: StreamData = {
        type: dataType,
        data: doc,
      };
      count++;
      return newDoc;
    }

    const stream = this.pagesCursor.stream({
      transform,
    });

    await this.handleStream(stream, this.pagesCursor, dataType);
    this.logDataCount(dataType, count);
  }

  logDataCount(dataType: string, count: number) {
    logger.info(createMessage(`Found ${dataType} count: ${count}`, this.options.reqId));
  }

  async streamAssets() {
    if (!this.isStreaming) {
      logger.info(createMessage('Dont stream assets', this.options.reqId));
      return;
    }

    const dataType = 'asset';
    let count = 0;

    const checksums = Object.keys(this.assetData);
    if (!checksums.length) {
      this.logDataCount(dataType, count);
      return;
    }

    const assetsCursor = findAssetsByChecksums(checksums, this.req);
    this.cursors.push(assetsCursor);
    
    const stream = assetsCursor.stream({
      transform: (doc: AssetDocument) => {
        const checksum = doc._id;
        const newDoc: StreamData = {
          type: dataType,
          data: {
            checksum,
            assetData: doc.data,
            filenames: [...this.assetData[checksum]],
          },
        };
        count++;
        return newDoc;
      },
    });

    await this.handleStream(stream, assetsCursor, dataType);
    this.logDataCount(dataType, count);
  }

  // Grab static assets for each page. 1 static asset can be used on more than
  // 1 page. Due to legacy considerations, 1 image can also be referred by more
  // than 1 filename. This is suboptimal and should be changed in the future
  addAsset({ checksum, key: filename, updated_at: updatedAt }: StaticAsset) {
    // Skip to next asset if the asset has not been updated
    if (this.options.updatedAssetsOnly && !isUpdated(this.options.reqTimestamp, updatedAt)) {
      return;
    }
    if (!this.assetData[checksum]) {
      this.assetData[checksum] = new Set();
    }
    this.assetData[checksum].add(filename);
  }

  createStreamErrorHandler(stream: Readable & AsyncIterable<Document>) {
    stream.once('error', (err) => {
      logger.error(createMessage(`There was an error streaming metadata: ${err}`, this.options.reqId));
      stream.destroy();
      this.pipeline.destroy();
    });
  }

  async waitForStreamEnd(stream: Readable & AsyncIterable<Document>) {
    await new Promise<void>((resolve, _) => {
      stream.once('end', () => {
        resolve();
      });
    });
  }

  async handleStream(stream: Readable & AsyncIterable<Document>, cursor: AbstractCursor, streamType: string) {
    this.currentStream = stream;
    // The DataStreamer class should be responsible for ending the pipeline
    stream.pipe(this.pipeline, { end: false });
    this.streams.push(stream);

    stream.once('error', async (err) => {
      logger.error(createMessage(`There was an error streaming ${streamType}: ${err}`, this.options.reqId));
      stream.destroy();
      if (!cursor.closed) {
        logger.info(createMessage('Closing cursor', this.options.reqId));
        await cursor.close();
        logger.info(createMessage('Closed cursor', this.options.reqId));
      }
    });

    // Wait for stream to end
    await new Promise<void>((resolve, _) => {
      stream.once('end', async () => {
        if (!cursor.closed) {
          logger.info(createMessage('About to close cursor', this.options.reqId));
          await cursor.close();
          logger.info(createMessage('Cursor closed', this.options.reqId));
        }
        resolve();
      });
    });
  }
}

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
