// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {validateWriter} from 'test/common/conformance';
import {describe, expect, test} from 'vitest';
import {GLBWriter} from '@loaders.gl/gltf';
import {parseSync} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf/bundled';
test('GLBWriter#loader conformance', () => {
  validateWriter(GLBWriter, 'GLBWriter');
});
describe('GLBWriter', () => {
  test('encodeSync(v3) round trips multiple binary chunks', () => {
    const glb = {
      type: 'glTF',
      version: 3,
      header: {byteOffset: 0, byteLength: 0, hasBinChunk: true},
      json: {
        asset: {version: '2.1'},
        buffers: [
          {byteLength: 4, chunk: 1},
          {byteLength: 4, chunk: 2}
        ]
      },
      jsonChunkIndex: 0,
      binChunks: [
        {
          chunkIndex: 1,
          byteOffset: 1,
          byteLength: 4,
          arrayBuffer: new Uint8Array([0, 1, 2, 3, 4, 0]).buffer
        },
        {
          chunkIndex: 2,
          byteOffset: 1,
          byteLength: 4,
          arrayBuffer: new Uint8Array([0, 5, 6, 7, 8, 0]).buffer
        }
      ]
    };
    const encoded = GLBWriter.encodeSync(glb);
    const decoded = parseSync(encoded, GLBLoader);
    expect(decoded.version).toBe(3);
    expect(decoded.json.asset.version).toBe('2.1');
    expect(
      decoded.binChunks.map(chunk =>
        Array.from(new Uint8Array(chunk.arrayBuffer, chunk.byteOffset, chunk.byteLength))
      )
    ).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8]
    ]);
  });
  test('encodeSync(v2) remains the default', () => {
    const glb = {
      type: 'glTF',
      version: 2,
      header: {byteOffset: 0, byteLength: 0, hasBinChunk: true},
      json: {asset: {version: '2.0'}},
      jsonChunkIndex: 0,
      binChunks: [
        {chunkIndex: 1, byteOffset: 0, byteLength: 2, arrayBuffer: new Uint8Array([1, 2]).buffer}
      ]
    };
    const encoded = GLBWriter.encodeSync(glb);
    const decoded = parseSync(encoded, GLBLoader);
    expect(decoded.version).toBe(2);
  });
  test('encodeSync(v3) rejects unsupported chunk encodings', () => {
    const glb = {
      type: 'glTF',
      version: 3,
      header: {byteOffset: 0, byteLength: 0, hasBinChunk: false},
      json: {asset: {version: '2.1'}},
      jsonChunkIndex: 0,
      binChunks: [],
      chunks: [{type: 0x54534554, encoding: 1, arrayBuffer: new ArrayBuffer(0)}]
    };
    expect(() => GLBWriter.encodeSync(glb)).toThrow(/Unsupported GLB chunk encoding 1/);
  });
});
