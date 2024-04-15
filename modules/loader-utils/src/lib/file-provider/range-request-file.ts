// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {FileProvider} from './file-provider';

/**
 * Provides file data using range requests to the server
 * @deprecated - will be replaced with ReadableFile
 */
export class RangeRequestFile implements FileProvider {
  /** The File object from which data is provided */
  private url: string;
  private size: bigint;

  /** Create a new BrowserFile */
  private constructor(url: string, size: bigint) {
    this.url = url;
    this.size = size;
  }

  static async create(url: string) {
    const res = await fetch(url, {method: 'HEAD'});
    const size = parseInt(res.headers.get('content-length') ?? '');
    return new RangeRequestFile(url, BigInt(size));
  }

  /**
   * returns an ArrayBuffer whose contents are a copy of this file bytes from start, inclusive, with provided length.
   * @param start The offset, in byte, from the start of the file where to start reading the data.
   * @param lenght Length of read data
   */
  private async getBytesFromFile(start: number, lenght: number): Promise<ArrayBuffer> {
    const res = await fetch(this.url, {
      method: 'GET',
      headers: {
        Range: `bytes=${start}-${start + lenght}`
      }
    });

    return (await res.arrayBuffer()).slice(0, lenght);
  }

  /**
   * Truncates the file descriptor.
   * @param length desired file lenght
   */
  async truncate(length: number): Promise<void> {
    throw new Error('file loaded via range requests cannot be changed');
  }

  /**
   * Append data to a file.
   * @param buffer data to append
   */
  async append(buffer: Uint8Array): Promise<void> {
    throw new Error('file loaded via range requests cannot be changed');
  }

  /** Close file */
  async destroy(): Promise<void> {
    throw new Error('file loaded via range requests cannot be changed');
  }

  /**
   * Gets an unsigned 8-bit integer at the specified byte offset from the start of the file.
   * @param offset The offset, in bytes, from the start of the file where to read the data.
   */
  async getUint8(offset: number | bigint): Promise<number> {
    const arrayBuffer = await this.getBytesFromFile(Number(offset), 1);
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
    const arrayBuffer = await this.getBytesFromFile(Number(offset), 2);
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
    const arrayBuffer = await this.getBytesFromFile(Number(offset), 4);
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
    const arrayBuffer = await this.getBytesFromFile(Number(offset), 8);
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

    return await this.getBytesFromFile(Number(startOffset), length);
  }

  /**
   * the length (in bytes) of the data.
   */
  get length(): bigint {
    return this.size;
  }
}
