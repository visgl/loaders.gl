// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {decodeString, toUint8Array} from './binary-utils';

/** Thrift compact-protocol read transport backed by Uint8Array. */
export class Uint8ArrayTransport {
  public readPos = 0;

  private readonly buffer: Uint8Array;

  constructor(buffer: Uint8Array) {
    this.buffer = toUint8Array(buffer);
  }

  commitPosition(): void {}

  rollbackPosition(): void {}

  isOpen(): boolean {
    return true;
  }

  open(): boolean {
    return true;
  }

  close(): boolean {
    return true;
  }

  setCurrSeqId(_sequenceId: number): void {}

  ensureAvailable(byteLength: number): void {
    if (this.readPos + byteLength > this.buffer.length) {
      throw new Error('Input buffer underrun');
    }
  }

  read(byteLength: number): Uint8Array {
    this.ensureAvailable(byteLength);
    const end = this.readPos + byteLength;
    const value = this.buffer.subarray(this.readPos, end);
    this.readPos = end;
    return value;
  }

  readByte(): number {
    this.ensureAvailable(1);
    const value = this.buffer[this.readPos++];
    return value > 127 ? value - 256 : value;
  }

  readString(byteLength: number): string {
    this.ensureAvailable(byteLength);
    const value = decodeString(this.buffer, this.readPos, this.readPos + byteLength);
    this.readPos += byteLength;
    return value;
  }

  borrow(): {buf: Uint8Array; readIndex: number; writeIndex: number} {
    return {
      buf: this.buffer,
      readIndex: this.readPos,
      writeIndex: this.buffer.length
    };
  }

  consume(bytesConsumed: number): void {
    this.readPos += bytesConsumed;
  }

  write(): never {
    throw new Error('Uint8ArrayTransport is read-only');
  }

  flush(): void {}
}
