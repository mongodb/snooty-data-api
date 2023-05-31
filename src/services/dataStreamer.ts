import { FindCursor } from 'mongodb';
import { AssetDocument, PageDocType, findAssetsByChecksums } from './database';
import { Response } from 'express';
import { stringer } from 'stream-json/jsonl/Stringer';

export interface StreamData {
  type: string;
  data: any;
}

const streamMetadata = (res: Response, metadataDoc: any) => {
  const chunk: StreamData = {
    type: 'metadata',
    data: metadataDoc,
  };
  res.write(`${JSON.stringify(chunk)}\n`);
};

const streamAssets = async (res: Response, assetData: Record<string, Set<string>>) => {
  const checksums = Object.keys(assetData);
  if (!checksums.length) {
    return;
  }

  const assetsCursor = await findAssetsByChecksums(checksums);
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
      return newDoc;
    },
  });

  // Use stringer() to efficiently transform documents/JS objects to JSONL format
  assetStream.pipe(stringer()).pipe(res);
  assetStream.once('error', (err) => {
    console.error(`There was an error streaming assets: ${err}`);
    assetStream.destroy();
  });
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
  metadataDoc: any,
  timestamp: number
) => {
  res.once('error', (err) => {
    console.error(`Error with response pipeline: ${err}`);
    // Destroy streams in hopes of preventing memory leaks
    res.destroy();
  });

  // Return timestamp to inform Gatsby Cloud when data was last queried
  const timestampChunk: StreamData = { type: 'timestamp', data: timestamp };
  res.write(`${JSON.stringify(timestampChunk)}\n`);

  streamMetadata(res, metadataDoc);

  const assetData: Record<string, Set<string>> = {};
  const pagesStream = pagesCursor.stream({
    transform(doc: PageDocType) {
      // Grab static assets for each page. 1 static asset can be used on more than
      // 1 page. Due to legacy considerations, 1 image can also be referred by more
      // than 1 filename. This is suboptimal and should be changed in the future
      doc.static_assets.forEach(({ checksum, key: filename }) => {
        if (!assetData[checksum]) {
          assetData[checksum] = new Set();
        }
        assetData[checksum].add(filename);
      });
      const newDoc: StreamData = {
        type: 'page',
        data: doc,
      };
      return newDoc;
    },
  });

  // We use pipe() instead of promisified pipeline() here due to weird behavior with
  // having 3 or more streams in the same pipeline and setting `end` to false.
  pagesStream.pipe(stringer()).pipe(res, { end: false });
  pagesStream.once('end', async () => {
    try {
      // Write newline to separate between data types to maintain JSONL format
      res.write('\n');
      await streamAssets(res, assetData);
    } catch (err) {
      // Don't throw error since it'll just be a fatal error. Report it
      // and end the stream since response headers could already have been
      // sent by then.
      console.error(`Error trying to stream assets: ${err}`);
      res.end();
      res.destroy();
    }
  });
  pagesStream.once('error', (err) => {
    console.error(`There was an error streaming pages: ${err}`);
    pagesStream.destroy();
  });
};
