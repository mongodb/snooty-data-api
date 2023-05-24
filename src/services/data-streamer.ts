import { FindCursor, WithId } from "mongodb";
import { Readable } from 'stream';
import { PageDocType, findAssetsByChecksums } from "./database";

type ChunkType = 'metadata' | 'page' | 'asset';

/**
 * A custom Readable class that pushes to the stream's buffer as it asynchronously 
 * reads MongoDB data. Since the data is loaded in async but reading is done in-order, 
 * `DataStream`'s queue of data could potentially be the total size of all documents.
 * 
 * See `DataStream._read()` for more details on implementation.
 * 
 * This class is intended to pipe its data to the Express Response object
 * in order to avoid sending the entire body of data at a single moment. Sending
 * everything all at the same time could result in slow responses.
 */
export class DataStream extends Readable {
  pagesCursor: FindCursor<PageDocType>;
  metadataDoc: WithId<Document> | null;
  isReading: boolean;
  assetData: Record<string, Set<string>>;

  constructor(pagesCursor: FindCursor<PageDocType>, metadataDoc: any) {
    super({ objectMode: true });

    this.pagesCursor = pagesCursor;
    this.metadataDoc = metadataDoc;
    this.isReading = false;
    this.assetData = {};

    this.on('error', (err) => {
      console.error(`Error encountered while streaming: ${err}` );
      // Ensure stream is destroyed to avoid memory leaks
      this.destroy();
    });
  }

  private async _streamPages() {
    for await (const page of this.pagesCursor) {
      // Grab static assets for each page. 1 static asset can be used on more than
      // 1 page. Due to legacy considerations, 1 image can also be referred by more
      // than 1 filename.
      page.static_assets.forEach(({ checksum, key: filename }) => {
        if (!this.assetData[checksum]) {
          this.assetData[checksum] = new Set();
        }
        this.assetData[checksum].add(filename);
      });

      this._pushChunk('page', page);
    }
  }

  private async _streamAssets() {
    const checksums = Object.keys(this.assetData);
    if (!checksums.length) {
      return;
    }

    const assetsCursor = await findAssetsByChecksums(checksums);

    for await (const asset of assetsCursor) {
      const checksum = asset._id;
      this._pushChunk('asset', {
        checksum,
        assetData: asset.data,
        filenames: [...this.assetData[checksum]],
      });
    }
  }

  private _streamMetadata() {
    if (this.metadataDoc) {
      this._pushChunk('metadata', this.metadataDoc);
    }
  }

  private _pushChunk(type: ChunkType, data: any) {
    const chunk = { type, data };
    return this.push(JSON.stringify(chunk));
  }
  
  /*
   * Called internally when streaming.
   * 
   * Ideally, we'd add as many documents to the queue as possible until `this.push()` 
   * returns `false`, and then subsequent calls to `_read()` will continue traversal
   * of the cursor(s) to add more documents to the queue. Instead, the stream never 
   * calls`_read()` again after a certain point and no new data is transmitted.
   * This could be due to `_read()` attempting to be performed asynchronously and
   * there's a mismatch between data being buffered, and data being consumed:
   * 
   * https://github.com/nodejs/node/blob/d39ba8aaf4501fc4eb5b6e8dbb8279b42b7f533b/lib/internal/streams/readable.js#L647
   * 
   * As a workaround, we attempt to keep pushing to the queue, regardless of size.
   */
  async _read() {
    if (!this.isReading) {
      this.isReading = true;

      this._streamMetadata();
      await this._streamPages();
      await this._streamAssets();

      this.push(null);
      this.isReading = false;
    }
  }
};
