export interface ResponseAsset {
  filenames: string[];
  data: BinaryData;
}
export type ResponseAssets = Record<string, ResponseAsset>
