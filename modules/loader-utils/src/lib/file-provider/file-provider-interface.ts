/**
 * Interface for providing file data
 */
export interface FileProviderInterface {
  /**
   * Cleanup class data
   */
  destroy(): Promise<void>;
  /**
   * Gets an unsigned 8-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  getUint8(offset: bigint): Promise<number>;

  /**
   * Gets an unsigned 16-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  getUint16(offset: bigint): Promise<number>;

  /**
   * Gets an unsigned 32-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the file of the view where to read the data.
   */
  getUint32(offset: bigint): Promise<number>;

  /**
   * Gets an unsigned 32-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in byte, from the file of the view where to read the data.
   */
  getBigUint64(offset: bigint): Promise<bigint>;

  /**
   * returns an ArrayBuffer whose contents are a copy of this file bytes from startOffset, inclusive, up to endOffset, exclusive.
   * @param startOffset The offset, in bytes, from the start of the file where to start reading the data.
   * @param endOffset The offset, in bytes, from the start of the file where to end reading the data.
   */
  slice(startOffset: bigint, endOffset: bigint): Promise<ArrayBuffer>;

  /**
   * the length (in bytes) of the data.
   */
  length: bigint;
}

/**
 * Check is the object has FileProvider members
 * @param fileProvider - tested object
 */
export const isFileProvider = (fileProvider: unknown) => {
  return (
    (fileProvider as FileProviderInterface)?.getUint8 &&
    (fileProvider as FileProviderInterface)?.slice &&
    (fileProvider as FileProviderInterface)?.length
  );
};
