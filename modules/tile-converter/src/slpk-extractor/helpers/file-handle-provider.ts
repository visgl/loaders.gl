import {FileProvider} from '@loaders.gl/i3s';
import {promises as fsPromises, PathLike} from 'fs';

/**
 * Provides file data using node fs library
 */
export class FileHandleProvider implements FileProvider {
  /**
   * Returns a new copy of FileHandleProvider
   * @param path The path to the file in file system
   */
  static async from(path: PathLike): Promise<FileHandleProvider> {
    const fileDescriptor = await fsPromises.open(path);
    return new FileHandleProvider(fileDescriptor, (await fileDescriptor.stat()).size);
  }

  /**
   * The FileHandle from which data is provided
   */
  private fileDescriptor: fsPromises.FileHandle;

  /**
   * The file length in bytes
   */
  private size: number;

  private constructor(fileDescriptor: fsPromises.FileHandle, size: number) {
    this.fileDescriptor = fileDescriptor;
    this.size = size;
  }

  /**
   * Gets an unsigned 8-bit integer (unsigned byte) at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint8(offset: number): Promise<number> {
    const val = new Uint8Array(
      (await this.fileDescriptor.read(Buffer.alloc(1), 0, 1, offset)).buffer.buffer
    ).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * Gets an unsigned 16-bit integer (unsigned byte) at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint16(offset: number): Promise<number> {
    const val = new Uint16Array(
      (await this.fileDescriptor.read(Buffer.alloc(2), 0, 2, offset)).buffer.buffer
    ).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * Gets an unsigned 32-bit integer (unsigned byte) at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint32(offset: number): Promise<number> {
    const val = new Uint32Array(
      (await this.fileDescriptor.read(Buffer.alloc(4), 0, 4, offset)).buffer.buffer
    ).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * returns an ArrayBuffer whose contents are a copy of this file bytes from startOffset, inclusive, up to endOffset, exclusive.
   * @param startOffset The offset, in bytes, from the start of the file where to start reading the data.
   * @param endOffset The offset, in bytes, from the start of the file where to end reading the data.
   */
  async slice(startOffset: number, endOffset: number): Promise<ArrayBuffer> {
    const length = endOffset - startOffset;
    return (await this.fileDescriptor.read(Buffer.alloc(length), 0, length, startOffset)).buffer
      .buffer;
  }

  /**
   * the length (in bytes) of the data.
   */
  get length(): number {
    return this.size;
  }
}
