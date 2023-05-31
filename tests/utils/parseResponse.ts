import { StreamData } from "../../src/services/dataStreamer";

interface ParsedData {
  pages: StreamData[];
  metadata: StreamData[];
  assets: StreamData[];
  timestamps: StreamData[];
};

const TYPE_TO_BUCKET = {
  page: 'pages',
  metadata: 'metadata',
  asset: 'assets',
  timestamp: 'timestamps',
};

/**
 * Parse Supertest Response text to organize streamed data based on their data type.
 * Consider this a workaround to the way Supertest returns fetched data that is
 * streamed in chunks.
 * 
 * @param text - The text of the Supertest Response object
 * @returns 
 */
export const parseResponse = (text: string) => {
  // Text should be in JSONL format
  const stringObjs = text.split('\n');
  const data: ParsedData = {
    pages: [],
    metadata: [],
    assets: [],
    timestamps: [],
  };

  stringObjs.forEach((stringObj) => {
    const obj: StreamData = JSON.parse(stringObj);
    const bucket = TYPE_TO_BUCKET[obj.type as keyof typeof TYPE_TO_BUCKET];
    data[bucket as keyof ParsedData].push(obj);
  });

  return data;
};
