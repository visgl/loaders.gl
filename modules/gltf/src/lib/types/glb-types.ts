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
};
