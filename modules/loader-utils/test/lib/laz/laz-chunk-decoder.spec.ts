// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decodeLAZChunkTable, NeedsMoreData} from '@loaders.gl/loader-utils';

const FIXED_CHUNK_TABLE = new Uint8Array([107, 237, 189, 84, 131, 215, 0, 0, 0]);
const VARIABLE_CHUNK_TABLE = new Uint8Array([
  135, 203, 162, 167, 61, 207, 107, 137, 42, 49, 95, 213, 77, 13, 174, 157, 154, 98, 215, 60, 30,
  211, 89, 209, 0, 0, 0
]);

test('decodeLAZChunkTable decodes fixed-size chunk byte lengths', () => {
  const padded = new Uint8Array(FIXED_CHUNK_TABLE.byteLength + 4);
  padded.set(FIXED_CHUNK_TABLE, 2);

  expect(
    decodeLAZChunkTable(padded.subarray(2, 2 + FIXED_CHUNK_TABLE.byteLength), {
      chunkCount: 4,
      pointCount: 1024,
      chunkSize: 256,
      variable: false
    })
  ).toEqual([
    {pointCount: 256, byteLength: 7485},
    {pointCount: 256, byteLength: 7498},
    {pointCount: 256, byteLength: 7492},
    {pointCount: 256, byteLength: 7488}
  ]);
});

test('decodeLAZChunkTable decodes variable point counts and byte lengths', () => {
  expect(
    decodeLAZChunkTable(VARIABLE_CHUNK_TABLE, {
      chunkCount: 5,
      pointCount: 100000,
      chunkSize: 0xffffffff,
      variable: true
    })
  ).toEqual([
    {pointCount: 66272, byteLength: 358488},
    {pointCount: 12121, byteLength: 99533},
    {pointCount: 12347, byteLength: 96729},
    {pointCount: 4571, byteLength: 36988},
    {pointCount: 4689, byteLength: 37315}
  ]);
});

test('decodeLAZChunkTable rejects truncated arithmetic input', () => {
  expect(() =>
    decodeLAZChunkTable(VARIABLE_CHUNK_TABLE.subarray(0, -1), {
      chunkCount: 5,
      pointCount: 100000,
      chunkSize: 0xffffffff,
      variable: true
    })
  ).toThrowError(NeedsMoreData);
});
