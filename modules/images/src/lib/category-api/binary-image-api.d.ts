/** MIME type, width and height extracted from binary compressed image data */
export type BinaryImageMetadata = {
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Extracts `{mimeType, width and height}` from a memory buffer containing a known image format
 * Currently supports `image/png`, `image/jpeg`, `image/bmp` and `image/gif`.
 * @param binaryData image file memory to parse
 * @returns metadata or null if memory is not a valid image file format layout.
 */
export function getBinaryImageMetadata(
  binaryData: DataView | ArrayBuffer
): BinaryImageMetadata | null;
