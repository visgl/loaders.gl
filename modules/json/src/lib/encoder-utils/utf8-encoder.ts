// loaders.gl
// SPDX-License-Identifier: MIT

import {ensureArrayBuffer} from "@loaders.gl/loader-utils";

/* global TextEncoder */
export class Utf8ArrayBufferEncoder {
  private readonly chunkSize: number;
  private strings: string[] = [];
  private totalLength = 0;
  private textEncoder: TextEncoder = new TextEncoder();

  constructor(chunkSize: number) {
    this.chunkSize = chunkSize;
  }

  push(...strings: string[]): void {
    for (const string of strings) {
      this.strings.push(string);
      this.totalLength += string.length;
    }
  }

  isFull(): boolean {
    return this.totalLength >= this.chunkSize;
  }

  getArrayBufferBatch(): ArrayBuffer {
    return ensureArrayBuffer(this.textEncoder.encode(this.getStringBatch()).buffer);
  }

  getStringBatch(): string {
    const stringChunk = this.strings.join('');
    this.strings = [];
    this.totalLength = 0;
    return stringChunk;
  }
}
