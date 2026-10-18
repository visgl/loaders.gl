// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '../env-utils/globals';
import {ReadableFile, WritableFile, Stat} from './file';

const NOT_IMPLEMENTED = new Error('Not implemented');

/** This class is a facade that gets replaced with an actual NodeFile instance  */
export class NodeFileFacade implements ReadableFile, WritableFile {
  handle: unknown;
  size: number = 0;
  bigsize: bigint = 0n;
  url: string = '';

  constructor(url: string, flags?: 'r' | 'w' | 'wx' | 'a+', mode?: number) {
    // Return the actual implementation instance
    if (globalThis.loaders?.NodeFile) {
      return new globalThis.loaders.NodeFile(url, flags, mode);
    }
    if (isBrowser) {
      throw new Error('Can\'t instantiate NodeFile in browser.');
    }
    throw new Error('Can\'t instantiate NodeFile. Make sure to import @loaders.gl/polyfills first.');
  }
  /** Read data */
  async read(start?: number | bigint, length?: number): Promise<ArrayBuffer> {
    throw NOT_IMPLEMENTED;
  }
  /** Write to file. The number of bytes written will be returned */
  async write(arrayBuffer: ArrayBuffer, offset?: number | bigint, length?: number | bigint): Promise<number> {
    throw NOT_IMPLEMENTED;
  }
  /** Get information about file */
  async stat(): Promise<Stat> {
    throw NOT_IMPLEMENTED;
  }

  /** Truncates the file descriptor. Only available on NodeFile. */
  async truncate(length: number): Promise<void> {
    throw NOT_IMPLEMENTED;
  }

  /** Append data to a file. Only available on NodeFile. */
  async append(data: Uint8Array): Promise<void> {
    throw NOT_IMPLEMENTED;
  }
  /** Close the file */
  async close(): Promise<void> {}
}
