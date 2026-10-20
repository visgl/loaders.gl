// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Checkpoint returned by {@link BinaryChunkReader.checkpoint}. */
export type BinaryChunkReaderCheckpoint = {
  /** Reader offset relative to the first retained chunk. */
  offset: number;
};

/** Options for {@link BinaryChunkReader}. */
export type BinaryChunkReaderOptions = {
  /** Number of consumed bytes to keep so callers can rewind. */
  maxRewindBytes?: number;
};

/** Chunked binary reader for streaming parsers. */
export class BinaryChunkReader {
  /** Current offset relative to the first retained chunk. */
  offset: number = 0;
  /** Whether the input stream has ended. */
  ended: boolean = false;
  /** Bytes behind the current offset to keep available for rewind. */
  maxRewindBytes: number;

  private chunks: Uint8Array[] = [];
  private scratch = new ArrayBuffer(8);
  private checkpoints: BinaryChunkReaderCheckpoint[] = [];

  constructor(options?: BinaryChunkReaderOptions) {
    this.maxRewindBytes = options?.maxRewindBytes || 0;
  }

  /** Retained source buffers. Exposed for compatibility with existing tests. */
  get arrayBuffers(): ArrayBufferLike[] {
    return this.chunks.map(chunk => chunk.buffer);
  }

  /** Add a binary chunk without copying when the input is an ArrayBuffer or typed-array view. */
  write(arrayBuffer: ArrayBufferLike | ArrayBufferView): void {
    this.chunks.push(toUint8ArrayView(arrayBuffer));
  }

  /** Mark the input as complete and discard retained chunks. */
  end(): void {
    this.chunks = [];
    this.checkpoints = [];
    this.offset = 0;
    this.ended = true;
  }

  /** Returns true when at least `bytes` can be read from the current offset. */
  hasAvailableBytes(bytes: number): boolean {
    return this.getAvailableByteLength() >= bytes;
  }

  /** Returns the number of bytes currently available from the current offset. */
  getAvailableByteLength(): number {
    let bytesAvailable = -this.offset;
    for (const chunk of this.chunks) {
      bytesAvailable += chunk.byteLength;
      if (bytesAvailable > 0) {
        continue;
      }
    }
    return Math.max(0, bytesAvailable);
  }

  /** Return source chunk ranges needed to read `bytes` from the current offset. */
  findBufferOffsets(bytes: number): [number, [number, number]][] | null {
    let offset = -this.offset;
    const selectedBuffers: [number, [number, number]][] = [];

    for (let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
      const chunk = this.chunks[chunkIndex];

      if (offset + chunk.byteLength <= 0) {
        offset += chunk.byteLength;
        continue;
      }

      const start = offset <= 0 ? Math.abs(offset) : 0;
      let end: number;

      if (start + bytes <= chunk.byteLength) {
        end = start + bytes;
        selectedBuffers.push([chunkIndex, [start, end]]);
        return selectedBuffers;
      }

      end = chunk.byteLength;
      selectedBuffers.push([chunkIndex, [start, end]]);
      bytes -= chunk.byteLength - start;
      offset += chunk.byteLength;
    }

    return null;
  }

  /** Read `bytes` into a DataView, returning null when more input is needed. */
  getDataView(bytes: number): DataView | null {
    const bufferOffsets = this.findBufferOffsets(bytes);
    if (!bufferOffsets) {
      if (this.ended) {
        throw new Error('binary data exhausted');
      }
      return null;
    }

    let dataView: DataView;
    if (bufferOffsets.length === 1) {
      const [chunkIndex, [start, end]] = bufferOffsets[0];
      const chunk = this.chunks[chunkIndex];
      dataView = new DataView(chunk.buffer, chunk.byteOffset + start, end - start);
    } else {
      const copy = this.combineBufferOffsets(bufferOffsets);
      dataView = new DataView(copy.buffer, copy.byteOffset, copy.byteLength);
    }

    this.offset += bytes;
    this.disposeBuffers();
    return dataView;
  }

  /** Read one byte. */
  readByte(): number {
    const bufferOffsets = this.findBufferOffsets(1);
    if (!bufferOffsets) {
      throw new Error('binary data exhausted');
    }
    const [chunkIndex, [start]] = bufferOffsets[0];
    const value = this.chunks[chunkIndex][start];
    this.offset++;
    this.disposeBuffers();
    return value;
  }

  /** Read a little-endian unsigned 16-bit integer. */
  readUint16LE(): number {
    const byte0 = this.readByte();
    const byte1 = this.readByte();
    return byte0 | (byte1 << 8);
  }

  /** Read a little-endian unsigned 32-bit integer. */
  readUint32LE(): number {
    const byte0 = this.readByte();
    const byte1 = this.readByte();
    const byte2 = this.readByte();
    const byte3 = this.readByte();
    return (byte0 | (byte1 << 8) | (byte2 << 16) | ((byte3 << 24) >>> 0)) >>> 0;
  }

  /** Read a little-endian signed 32-bit integer. */
  readInt32LE(): number {
    return this.readUint32LE() | 0;
  }

  /** Read a little-endian 64-bit floating point number. */
  readFloat64LE(): number {
    const dataView = this.getContiguousDataView(8);
    if (dataView) {
      return dataView.getFloat64(0, true);
    }

    const bytes = new Uint8Array(this.scratch);
    this.readInto(bytes, 0, 8);
    return new DataView(this.scratch).getFloat64(0, true);
  }

  /** Read bytes into a caller-provided target. */
  readInto(target: Uint8Array, targetOffset: number, length: number): void {
    const bufferOffsets = this.findBufferOffsets(length);
    if (!bufferOffsets) {
      throw new Error('binary data exhausted');
    }

    let offset = targetOffset;
    for (const [chunkIndex, [start, end]] of bufferOffsets) {
      const chunk = this.chunks[chunkIndex];
      target.set(chunk.subarray(start, end), offset);
      offset += end - start;
    }
    this.offset += length;
    this.disposeBuffers();
  }

  /** Read bytes as a Uint8Array, copying only when the requested range spans chunks. */
  readBytes(length: number): Uint8Array {
    const bufferOffsets = this.findBufferOffsets(length);
    if (!bufferOffsets) {
      throw new Error('binary data exhausted');
    }

    let bytes: Uint8Array;
    if (bufferOffsets.length === 1) {
      const [chunkIndex, [start, end]] = bufferOffsets[0];
      const chunk = this.chunks[chunkIndex];
      bytes = chunk.subarray(start, end);
    } else {
      bytes = this.combineBufferOffsets(bufferOffsets);
    }

    this.offset += length;
    this.disposeBuffers();
    return bytes;
  }

  /** Advance the current offset. */
  skip(bytes: number): void {
    this.offset += bytes;
  }

  /** Move the current offset backwards. */
  rewind(bytes: number): void {
    this.offset -= bytes;
  }

  /** Create a checkpoint that can be restored later. */
  checkpoint(): BinaryChunkReaderCheckpoint {
    const checkpoint = {offset: this.offset};
    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  /** Restore a previous checkpoint. */
  restore(checkpoint: BinaryChunkReaderCheckpoint): void {
    this.offset = checkpoint.offset;
    this.checkpoints.pop();
  }

  /** Dispose chunks that are older than the configured rewind window. */
  discardConsumed(): void {
    this.disposeBuffers();
  }

  /** Copy multiple source ranges into one tightly sized ArrayBuffer. */
  _combineArrayBuffers(bufferOffsets: [number, [number, number]][]): ArrayBufferLike {
    return this.combineBufferOffsets(bufferOffsets).buffer;
  }

  private getContiguousDataView(bytes: number): DataView | null {
    const bufferOffsets = this.findBufferOffsets(bytes);
    if (!bufferOffsets || bufferOffsets.length !== 1) {
      return null;
    }
    const [chunkIndex, [start, end]] = bufferOffsets[0];
    const chunk = this.chunks[chunkIndex];
    const dataView = new DataView(chunk.buffer, chunk.byteOffset + start, end - start);
    this.offset += bytes;
    this.disposeBuffers();
    return dataView;
  }

  private disposeBuffers(): void {
    let protectedOffset =
      this.checkpoints.length > 0
        ? Math.min(...this.checkpoints.map(checkpoint => checkpoint.offset))
        : Number.POSITIVE_INFINITY;
    while (
      this.chunks.length > 0 &&
      this.offset - this.maxRewindBytes >= this.chunks[0].byteLength &&
      protectedOffset >= this.chunks[0].byteLength
    ) {
      this.offset -= this.chunks[0].byteLength;
      // Checkpoints use offsets relative to the first retained chunk and must move with disposal.
      for (const checkpoint of this.checkpoints) {
        checkpoint.offset -= this.chunks[0].byteLength;
      }
      protectedOffset -= this.chunks[0].byteLength;
      this.chunks.shift();
    }
  }

  private combineBufferOffsets(bufferOffsets: [number, [number, number]][]): Uint8Array {
    let byteLength = 0;
    for (const [, [start, end]] of bufferOffsets) {
      byteLength += end - start;
    }

    const result = new Uint8Array(byteLength);
    let resultOffset = 0;
    for (const [chunkIndex, [start, end]] of bufferOffsets) {
      const chunk = this.chunks[chunkIndex];
      result.set(chunk.subarray(start, end), resultOffset);
      resultOffset += end - start;
    }
    return result;
  }
}

function toUint8ArrayView(arrayBuffer: ArrayBufferLike | ArrayBufferView): Uint8Array {
  if (ArrayBuffer.isView(arrayBuffer)) {
    return new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
  }
  return new Uint8Array(arrayBuffer);
}
