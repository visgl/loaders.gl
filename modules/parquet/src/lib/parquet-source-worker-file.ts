// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile, Stat} from '@loaders.gl/loader-utils';

import type {ParquetSourceWorkerRange} from './parquet-source-worker-types';

/** Readable file backed only by selected transferred ranges from the source object. */
export class ParquetSourceWorkerFile implements ReadableFile {
  /** Synthetic worker-local file handle. */
  readonly handle = 'parquet-source-worker';
  /** Synthetic worker-local URL. */
  readonly url = '';
  /** Total source byte length. */
  readonly size: number;
  /** Total source byte length as a bigint. */
  readonly bigsize: bigint;
  /** Selected ranges available to decoder reads. */
  private readonly ranges: ParquetSourceWorkerRange[];

  /** Creates a virtual file over transferred selected ranges. */
  constructor(fileByteLength: number, ranges: ParquetSourceWorkerRange[]) {
    this.size = fileByteLength;
    this.bigsize = BigInt(fileByteLength);
    this.ranges = ranges;
  }

  /** Releases this no-op worker-local virtual file. */
  async close(): Promise<void> {}

  /** Returns the original source byte length. */
  async stat(): Promise<Stat> {
    return {size: this.size, bigsize: this.bigsize, isDirectory: false};
  }

  /** Reads one decoder-requested slice from a transferred selected range. */
  async read(
    start: number | bigint = 0,
    length: number = this.size - Number(start)
  ): Promise<ArrayBuffer> {
    const offset = Number(start);
    const range = this.ranges.find(
      candidate =>
        offset >= candidate.offset &&
        offset + length <= candidate.offset + candidate.data.byteLength
    );
    if (!range) {
      throw new Error(
        `Parquet worker requested unavailable byte range ${offset}-${offset + length - 1}`
      );
    }
    const relativeOffset = offset - range.offset;
    return range.data.slice(relativeOffset, relativeOffset + length);
  }
}
