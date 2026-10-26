// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Minimal byte reader used by the TWKB codec. */
export class TWKBReader {
  /** Data view used for reading bytes. */
  private readonly dataView: DataView;
  /** Current read position in bytes. */
  byteOffset = 0;

  constructor(arrayBuffer: ArrayBuffer) {
    this.dataView = new DataView(arrayBuffer);
  }

  /** Reads one unsigned byte and advances the cursor. */
  readUInt8(): number {
    return this.dataView.getUint8(this.byteOffset++);
  }

  /** Reads one unsigned variable-length integer and advances the cursor. */
  readVarInt(): number {
    let result = 0;
    let bytesRead = 0;
    let nextByte: number;
    do {
      nextByte = this.dataView.getUint8(this.byteOffset + bytesRead);
      result += (nextByte & 0x7f) << (7 * bytesRead++);
    } while (nextByte >= 0x80);
    this.byteOffset += bytesRead;
    return result;
  }
}

/** Resizable byte writer used by the TWKB encoder. */
export class TWKBWriter {
  /** Backing storage, exposed for nested-size patching in the codec. */
  arrayBuffer: ArrayBuffer;
  /** Data view backed by the current output buffer. */
  private dataView: DataView;
  /** Current write position in bytes. */
  byteOffset = 0;
  /** Whether the output buffer may grow when full. */
  private readonly allowResize: boolean;

  constructor(initialCapacity = 0, allowResize = true) {
    this.arrayBuffer = new ArrayBuffer(initialCapacity);
    this.dataView = new DataView(this.arrayBuffer);
    this.allowResize = allowResize;
  }

  /** Writes one byte, growing the output buffer when needed. */
  writeUInt8(value: number): void {
    this.ensureSize(1);
    this.dataView.setUint8(this.byteOffset++, value);
  }

  /** Writes an unsigned variable-length integer. */
  writeVarInt(value: number): number {
    let length = 1;
    while ((value & 0xffffff80) !== 0) {
      this.writeUInt8((value & 0x7f) | 0x80);
      value >>>= 7;
      length++;
    }
    this.writeUInt8(value & 0x7f);
    return length;
  }

  /** Returns the encoded TWKB bytes without unused buffer capacity. */
  getArrayBuffer(): ArrayBuffer {
    return this.arrayBuffer.slice(0, this.byteOffset);
  }

  /** Ensures the backing buffer can hold the next write. */
  private ensureSize(additionalBytes: number): void {
    const requiredSize = this.byteOffset + additionalBytes;
    if (requiredSize <= this.arrayBuffer.byteLength) return;
    if (!this.allowResize) throw new Error('TWKBWriter buffer overflow');
    const newBuffer = new ArrayBuffer(Math.max(requiredSize, this.arrayBuffer.byteLength * 2, 32));
    new Uint8Array(newBuffer).set(new Uint8Array(this.arrayBuffer));
    this.arrayBuffer = newBuffer;
    this.dataView = new DataView(newBuffer);
  }
}
