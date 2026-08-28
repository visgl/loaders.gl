// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type GLBBinChunk = {
  /** Zero-based index of this chunk in the GLB container. */
  chunkIndex: number;
  byteOffset: number;
  byteLength: number;
  arrayBuffer: ArrayBuffer;
};

/** A non-JSON chunk that can be emitted in a GLB v3 container. */
export type GLBChunk = {
  /** Four-byte chunk type, stored as a little-endian unsigned integer. */
  type: number;
  /** Chunk payload. */
  arrayBuffer: ArrayBuffer;
  /** GLB v3 chunk encoding. Only zero is currently defined. */
  encoding?: number;
};

export type GLB = {
  type: string;
  /** Binary glTF container version. */
  version: number;

  // Put less important stuff in a header, to avoid clutter
  header: {
    byteOffset: number; // Byte offset into the initial arrayBuffer
    byteLength: number;
    hasBinChunk: boolean;
  };

  // Per spec we must iterate over chunks, ignoring all except JSON and BIN
  json: Record<string, any>;
  /** Zero-based index of the glTF JSON chunk in the GLB container. */
  jsonChunkIndex: number;
  binChunks: GLBBinChunk[];
  /** Optional generic chunks to preserve or emit in GLB v3. */
  chunks?: GLBChunk[];
  /** Legacy single BIN payload accepted by the writer. */
  binary?: ArrayBuffer;
};
