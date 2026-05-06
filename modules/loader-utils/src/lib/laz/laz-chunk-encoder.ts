// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LAZChunkMetadata} from './laz-chunk-decoder';

/** Feedable TypeScript LAZ chunk encoder. */
export class FeedableLAZChunkEncoder {
  private metadata: LAZChunkMetadata;
  private chunks: Uint8Array[] = [];
  private closed = false;

  constructor(metadata: LAZChunkMetadata) {
    this.metadata = metadata;
  }

  /** Add raw LAS point record bytes to the encoder input. */
  feed(chunk: ArrayBuffer | ArrayBufferView): void {
    if (this.closed) {
      throw new Error('Cannot feed a closed LAZ chunk encoder');
    }
    this.chunks.push(toUint8Array(chunk));
  }

  /** Mark the raw point input as complete. */
  close(): void {
    this.closed = true;
  }

  /** Encode all fed point data into one compressed LAZ chunk. */
  encode(): Uint8Array {
    if (!this.closed) {
      throw new Error('LAZ chunk encoder input is not closed');
    }
    return encodeLAZChunk(concatenateUint8Arrays(this.chunks), this.metadata);
  }
}

/** Create a feedable TypeScript LAZ chunk encoder. */
export function createLAZChunkEncoder(metadata: LAZChunkMetadata): FeedableLAZChunkEncoder {
  return new FeedableLAZChunkEncoder(metadata);
}

/** Encode raw LAS point records into a compressed LAZ chunk. */
export function encodeLAZChunk(
  _rawPointData: ArrayBuffer | ArrayBufferView,
  _metadata: LAZChunkMetadata
): Uint8Array {
  throw new Error('TypeScript LAZ chunk encoding is not implemented yet');
}

function toUint8Array(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function concatenateUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((length, chunk) => length + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
