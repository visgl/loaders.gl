// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {_BinaryChunkReader as BinaryChunkReader} from '@loaders.gl/shapefile';
const buf1 = new Uint8Array([1, 2, 3]).buffer;
const buf2 = new Uint8Array([4, 5, 6]).buffer;
const buf3 = new Uint8Array([7, 8, 9]).buffer;
test('BinaryChunkReader', () => {
  const reader = new BinaryChunkReader();
  expect(reader).toBeTruthy();
});
test('BinaryChunkReader#add arrayBuffers', () => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  expect(reader.arrayBuffers.length).toBe(2);
});
test('BinaryChunkReader#findBufferOffsets single view', () => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  let bufferOffsets = reader.findBufferOffsets(2);
  expect(bufferOffsets).toEqual([[0, [0, 2]]]);
  reader.skip(1);
  bufferOffsets = reader.findBufferOffsets(2);
  expect(bufferOffsets).toEqual([[0, [1, 3]]]);
  reader.skip(2);
  bufferOffsets = reader.findBufferOffsets(2);
  expect(bufferOffsets).toEqual([[1, [0, 2]]]);
  reader.skip(3);
  bufferOffsets = reader.findBufferOffsets(1);
  expect(bufferOffsets).toEqual([[2, [0, 1]]]);
  bufferOffsets = reader.findBufferOffsets(3);
  expect(bufferOffsets).toEqual([[2, [0, 3]]]);
});
test('BinaryChunkReader#findBufferOffsets multiple views', () => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  let bufferOffsets = reader.findBufferOffsets(5);
  expect(bufferOffsets).toEqual([
    [0, [0, 3]],
    [1, [0, 2]]
  ]);
  reader.skip(2);
  bufferOffsets = reader.findBufferOffsets(5);
  expect(bufferOffsets).toEqual([
    [0, [2, 3]],
    [1, [0, 3]],
    [2, [0, 1]]
  ]);
  bufferOffsets = reader.findBufferOffsets(2);
  expect(bufferOffsets).toEqual([
    [0, [2, 3]],
    [1, [0, 1]]
  ]);
});
test('BinaryChunkReader#getDataView single source array', () => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  let view = reader.getDataView(2);
  expect(view?.getUint8(0)).toBe(1);
  expect(view?.getUint8(1)).toBe(2);
  reader.skip(2);
  view = reader.getDataView(2);
  expect(view?.getUint8(0)).toBe(5);
  expect(view?.getUint8(1)).toBe(6);
});
test('BinaryChunkReader#getDataView multiple source arrays', () => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  reader.skip(2);
  let view = reader.getDataView(2);
  expect(view?.getUint8(0)).toBe(3);
  expect(view?.getUint8(1)).toBe(4);
  view = reader.getDataView(4);
  expect(view?.getUint8(0)).toBe(5);
  expect(view?.getUint8(1)).toBe(6);
  expect(view?.getUint8(2)).toBe(7);
  expect(view?.getUint8(3)).toBe(8);
});
test('BinaryChunkReader#disposeBuffers', () => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  reader.skip(2);
  expect(reader.arrayBuffers.length).toBe(3);
  reader.getDataView(1);
  expect(reader.arrayBuffers.length).toBe(2);
  reader.getDataView(3);
  expect(reader.arrayBuffers.length).toBe(1);
  reader.getDataView(3);
  expect(reader.arrayBuffers.length).toBe(0);
});
test('BinaryChunkReader#disposeBuffers with maxRewindBytes', () => {
  const reader = new BinaryChunkReader({maxRewindBytes: 2});
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  reader.skip(2);
  expect(reader.arrayBuffers.length).toBe(3);
  reader.getDataView(2);
  expect(reader.arrayBuffers.length).toBe(3);
  reader.getDataView(1);
  expect(reader.arrayBuffers.length).toBe(2);
});
