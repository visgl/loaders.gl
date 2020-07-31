 /** MIME type, width and height extracted from binary compressed image data */
 export type BinaryImageMetadata = {
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Determines if a chunk of "raw" memory represents a binary encoded image
 * Currently supports `image/png`, `image/jpeg`, 'image/gif`, `image/bmp`.
 */
export function getBinaryImageMetadata(binaryData: DataView | ArrayBuffer): BinaryImageMetadata | null;
