 /** MIME type, width and height extracted from binary compressed image data */
export type BinaryImageMetadata = {
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Determines if the "raw" memory 
 * Currently supports `image/png`, `image/jpeg`, 'image/gif`, `image/bmp`.
 * @param dataView "raw" memory to inspect
 */
export function getBinaryImageMetadata(dataView: DataView | ArrayBuffer): BinaryImageMetadata | null;
