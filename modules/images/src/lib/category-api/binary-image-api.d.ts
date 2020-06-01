 /** MIME type, width and height extracted from binary compressed image data */
 export type BinaryImageMetadata = {
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Determines if the "raw" memory 
 * Currently supports `image/png`, `image/jpeg`, 'image/gif`, `image/bmp`.
 * @param binaryData "raw" memory to inspect
 */
export function getBinaryImageMetadata(binaryData: DataView | ArrayBuffer): BinaryImageMetadata | null;
