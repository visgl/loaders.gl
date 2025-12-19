// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FileProviderInterface} from './file-provider-interface';
import {NodeFileFacade as NodeFile} from '../files/node-file-facade';

/**
 * Provides file data using node fs library
 * @deprecated - will be replaced with ReadableFile
 */
export class FileHandleFile implements FileProviderInterface {
  /** The FileHandle from which data is provided */
  private file: NodeFile;

  /** Create a new FileHandleFile */
  constructor(path: string, append: boolean = false) {
    this.file = new NodeFile(path, append ? 'a+' : 'r');
  }

  /**
   * Truncates the file descriptor.
   * @param length desired file lenght
   */
  async truncate(length: number): Promise<void> {
    await this.file.truncate(length);
  }

  /**
   * Append data to a file.
   * @param buffer data to append
   */
  async append(buffer: Uint8Array): Promise<void> {
    await this.file.append(buffer);
  }

  /** Close file */
  async destroy(): Promise<void> {
    await this.file.close();
  }

  /**
   * Gets an unsigned 8-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint8(offset: number | bigint): Promise<number> {
    const arrayBuffer = await this.file.read(offset, 1);
    const val = new Uint8Array(arrayBuffer).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * Gets an unsigned 16-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint16(offset: number | bigint): Promise<number> {
    const arrayBuffer = await this.file.read(offset, 2);
    const val = new Uint16Array(arrayBuffer).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * Gets an unsigned 32-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint32(offset: number | bigint): Promise<number> {
    const arrayBuffer = await this.file.read(offset, 4);
    const val = new Uint32Array(arrayBuffer).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * Gets an unsigned 32-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getBigUint64(offset: number | bigint): Promise<bigint> {
    const arrayBuffer = await this.file.read(offset, 8);
    const val = new BigInt64Array(arrayBuffer).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }

  /**
   * returns an ArrayBuffer whose contents are a copy of this file bytes from startOffset, inclusive, up to endOffset, exclusive.
   * @param startOffset The offset, in byte, from the start of the file where to start reading the data.
   * @param endOffset The offset, in bytes, from the start of the file where to end reading the data.
   */
  async slice(startOffset: bigint, endOffset: bigint): Promise<ArrayBuffer> {
    const bigLength = endOffset - startOffset;
    if (bigLength > Number.MAX_SAFE_INTEGER) {
      throw new Error('too big slice');
    }
    const length = Number(bigLength);
    return await this.file.read(startOffset, length);
  }

  /**
   * the length (in bytes) of the data.
   */
  get length(): bigint {
    return this.file.bigsize;
  }
}
