import {FileProvider} from './file-provider';

const toNumber = (bigint: bigint) => {
  if (bigint > Number.MAX_SAFE_INTEGER) {
    throw new Error('Offset is out of bounds');
  }
  return Number(bigint);
};

/**
 * Provides file data using DataView
 */
export class DataViewFileProvider implements FileProvider {
  /**
   * The DataView from which data is provided
   */
  private file: DataView;

  constructor(file: DataView) {
    this.file = file;
  }

  /**
   * Gets an unsigned 8-bit integer (unsigned byte) at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  getUint8(offset: bigint): Promise<number> {
    return Promise.resolve(this.file.getUint8(toNumber(offset)));
  }

  /**
   * Gets an unsigned 16-bit integer (unsigned byte) at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  getUint16(offset: bigint): Promise<number> {
    return Promise.resolve(this.file.getUint16(toNumber(offset), true));
  }

  /**
   * Gets an unsigned 32-bit integer (unsigned byte) at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  getUint32(offset: bigint): Promise<number> {
    return Promise.resolve(this.file.getUint32(toNumber(offset), true));
  }

  /**
   * Gets an unsigned 64-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  getBigUint64(offset: bigint): Promise<bigint> {
    return Promise.resolve(this.file.getBigUint64(toNumber(offset), true));
  }

  /**
   * returns an ArrayBuffer whose contents are a copy of this file bytes from startOffset, inclusive, up to endOffset, exclusive.
   * @param startOffset The offset, in bytes, from the start of the file where to start reading the data.
   * @param endOffset The offset, in bytes, from the start of the file where to end reading the data.
   */
  slice(startOffset: bigint, endOffset: bigint): Promise<ArrayBuffer> {
    return Promise.resolve(this.file.buffer.slice(toNumber(startOffset), toNumber(endOffset)));
  }

  /**
   * the length (in bytes) of the data.
   */
  get length() {
    return BigInt(this.file.byteLength);
  }
}
