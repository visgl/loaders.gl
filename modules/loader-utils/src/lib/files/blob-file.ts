// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ReadableFile} from './file';

/**
 * BlobFile provides a "file like interface" to the data in a Blob or File object
 */
export class BlobFile implements ReadableFile {
  readonly handle: Blob;
  readonly size: number;
  readonly bigsize: bigint;
  readonly url: string;

  constructor(blob: Blob | File | ArrayBuffer) {
    this.handle = blob instanceof ArrayBuffer ? new Blob([blob]) : blob;
    this.size = blob instanceof ArrayBuffer ? blob.byteLength : blob.size;
    this.bigsize = BigInt(this.size);
    this.url = blob instanceof File ? blob.name : '';
  }

  async close() {}

  async stat() {
    return {
      size: this.handle.size,
      bigsize: BigInt(this.handle.size),
      isDirectory: false
    };
  }

  async read(start?: number | bigint, length?: number): Promise<ArrayBuffer> {
    const arrayBuffer = await this.handle
      .slice(Number(start), Number(start) + Number(length))
      .arrayBuffer();
    return arrayBuffer;
  }
}
