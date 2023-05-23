import { FindCursor, ObjectId } from "mongodb";
import { Readable } from 'stream';
import { AssetDocument, PageDocType, ResponseAsset, db } from "./database";

export class DataStreamer {
  readableStream: Readable;
  pagesCursor: FindCursor<PageDocType>;
  assetIds: string[];
  metadataDoc: any;

  constructor(pagesCursor: FindCursor<PageDocType>, metadataDoc: any) {
    this.readableStream = new Readable();
    this.pagesCursor = pagesCursor;
    this.assetIds = [];
    this.metadataDoc = metadataDoc;
  }

  private async _streamMetadata() {
    const chunk = {
      type: 'metadata',
      data: this.metadataDoc,
    };
    this.readableStream.push(JSON.stringify(chunk));
  }

  /**
   * Adds pages to the readable stream and identifies if the page has assets.
   * 
   * @returns Assets associated with pages
   */
  private async _streamPages() {
    const assetData: Record<string, Set<string>> = {};

    for await (const page of this.pagesCursor) {
      const chunk = { type: 'page', data: page };

      // Grab static assets for each page. 1 static asset can be used on more than
      // 1 page. Due to legacy considerations, 1 image can also be referred by more
      // than 1 filename.
      page.static_assets.forEach(({ checksum, key: filename }) => {
        if (!assetData[checksum]) {
          assetData[checksum] = new Set();
        }
        assetData[checksum].add(filename);
      });

      this.readableStream.push(JSON.stringify(chunk));
    }

    return assetData;
  }

  private async _streamAssets(assetData: Record<string, Set<string>>) {
    const checksums = Object.keys(assetData);
    if (!checksums.length) {
      return;
    }

    const dbSession = await db();
    const assetsCursor = dbSession.collection<AssetDocument>('assets').find({ _id: { $in: checksums } });

    for await (const asset of assetsCursor) {
      const checksum = asset._id;
      const chunk = {
        type: 'asset',
        data: {
          checksum,
          assetData: asset.data,
          filenames: [...assetData[checksum]],
        },
      };
      this.readableStream.push(JSON.stringify(chunk));
    }
  }

  async createStream() {
    await this._streamMetadata();
    const assetData = await this._streamPages();
    await this._streamAssets(assetData);

    // End stream
    this.readableStream.push(null);
    return this.readableStream;
  }

  async streamPages() {
    const assetData: Record<string, Set<string>> = {};

    for await (const doc of this.pagesCursor) {
      const data = { type: 'page', data: doc };

      // An image asset will have a consistent checksum, but can have different filenames (keys),
      // even within the same repo. This is more of an edge case and is not ideal.
      doc.static_assets.forEach(({ checksum, key }) => {
        if (!assetData[checksum]) {
          assetData[checksum] = new Set();
        }
        assetData[checksum].add(key);
      });

      this.readableStream.push(JSON.stringify(data));
    }

    const checksums = Object.keys(assetData);
    const responseAssets: ResponseAsset[] = [];
    if (!checksums.length) {
      return responseAssets;
    }

    // Populate binary data for every asset checksum and convert set of filenames
    // to array for JSON compatibility
    const dbSession = await db();
    const assetsCursor = dbSession
      .collection<AssetDocument>('assets')
      .find({ _id: { $in: checksums } });

    for await (const asset of assetsCursor) {
      const checksum = asset._id;
      const data = {
        type: 'asset',
        data: {
          checksum,
          assetData: asset.data,
          filenames: [...assetData[checksum]],
        },
      };

      this.readableStream.push(JSON.stringify(data));
    }

    // assetsCursor.forEach((asset) => {
    //   const checksum = asset._id;
    //   const data = {
    //     type: 'asset',
    //     data: {
    //       checksum,
    //       assetData: asset.data,
    //       filenames: [...assetData[checksum]],
    //     },
    //   };

    //   this.readableStream.push(JSON.stringify(data));
    // });

    const metadataQuery = {
      build_id: new ObjectId('646bae4bc41d7b9a472b51ec'),
    };
    const res = await dbSession.collection('metadata').find(metadataQuery).toArray();
    console.log(res);
    const data = {
      type: 'metadata',
      data: res[0],
    };
    this.readableStream.push(JSON.stringify(data));

    this.readableStream.push(JSON.stringify({ 'test': 'object' }));

    this.readableStream.push(null);
  }
}
