// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../../src/lib/types/gltf-types';

/** Small loaded legacy asset with optional JSON replacements and borrowed backing-buffer padding. */
export function createAccessorAsset(
  properties: Record<string, unknown>,
  byteLength = 128,
  borrowedOffset = 0
): GLTFWithBuffers {
  const arrayBuffer = new ArrayBuffer(byteLength + borrowedOffset + 3);
  new Uint8Array(arrayBuffer).fill(0xa5);
  return {
    json: {
      asset: {version: '1.0'},
      buffers: {data: {uri: 'data.bin', byteLength}},
      bufferViews: {view: {buffer: 'data', byteLength}},
      ...properties
    },
    buffers: [{arrayBuffer, byteOffset: borrowedOffset, byteLength}]
  } as unknown as GLTFWithBuffers;
}
