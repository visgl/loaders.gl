// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile, Stat} from './file';

/** Random-access file over an in-memory ArrayBuffer without routing reads through Blob. */
export class ArrayBufferFile implements ReadableFile {
  /** Complete in-memory file. */
  readonly handle: ArrayBuffer;
  /** File length in bytes. */
  readonly size: number;
  /** File length in bytes as a bigint. */
  readonly bigsize: bigint;
  /** In-memory files do not have a URL. */
  readonly url = '';

  /** Creates a random-access view of an in-memory file. */
  constructor(arrayBuffer: ArrayBuffer) {
    this.handle = arrayBuffer;
    this.size = arrayBuffer.byteLength;
    this.bigsize = BigInt(this.size);
  }

  /** Releases the file; in-memory buffers do not require cleanup. */
  async close(): Promise<void> {}

  /** Returns the in-memory file size. */
  async stat(): Promise<Stat> {
    return {size: this.size, bigsize: this.bigsize, isDirectory: false};
  }

  /** Copies one byte range from the in-memory file. */
  async read(
    start: number | bigint = 0,
    length?: number,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }
    const startOffset = Number(start);
    const endOffset = length === undefined ? this.size : startOffset + length;
    return this.handle.slice(startOffset, endOffset);
  }
}
