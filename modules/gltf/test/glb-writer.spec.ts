// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {validateWriter} from 'test/common/conformance';

import {GLBWriter} from '@loaders.gl/gltf';
import {parseSync} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf/bundled';

test('GLBWriter#loader conformance', t => {
  validateWriter(t, GLBWriter, 'GLBWriter');
  t.end();
});

test('GLBWriter#encodeSync(v3) round trips multiple binary chunks', t => {
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
        byteOffset: 0,
        byteLength: 4,
        arrayBuffer: new Uint8Array([1, 2, 3, 4]).buffer
      },
      {
        chunkIndex: 2,
        byteOffset: 0,
        byteLength: 4,
        arrayBuffer: new Uint8Array([5, 6, 7, 8]).buffer
      }
    ]
  };

  const encoded = GLBWriter.encodeSync(glb);
  const decoded = parseSync(encoded, GLBLoader);
  t.equal(decoded.version, 3, 'writes GLB v3');
  t.equal(decoded.json.asset.version, '2.1', 'round trips JSON');
  t.deepEqual(
    decoded.binChunks.map(chunk =>
      Array.from(new Uint8Array(chunk.arrayBuffer, chunk.byteOffset, chunk.byteLength))
    ),
    [
      [1, 2, 3, 4],
      [5, 6, 7, 8]
    ],
    'round trips all BIN chunks'
  );
  t.end();
});

test('GLBWriter#encodeSync(v2) remains the default', t => {
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
  t.equal(decoded.version, 2, 'defaults to GLB v2');
  t.end();
});

test('GLBWriter#encodeSync(v3) rejects unsupported chunk encodings', t => {
  const glb = {
    type: 'glTF',
    version: 3,
    header: {byteOffset: 0, byteLength: 0, hasBinChunk: false},
    json: {asset: {version: '2.1'}},
    jsonChunkIndex: 0,
    binChunks: [],
    chunks: [{type: 0x54534554, encoding: 1, arrayBuffer: new ArrayBuffer(0)}]
  };
  t.throws(() => GLBWriter.encodeSync(glb), /Unsupported GLB chunk encoding 1/);
  t.end();
});
