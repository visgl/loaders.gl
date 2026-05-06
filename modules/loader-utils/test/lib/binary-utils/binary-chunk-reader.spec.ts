// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BinaryChunkReader} from '@loaders.gl/loader-utils';

const CHUNK_1 = new Uint8Array([1, 2, 3]).buffer;
const CHUNK_2 = new Uint8Array([4, 5, 6]).buffer;
const CHUNK_3 = new Uint8Array([7, 8, 9]).buffer;

test('BinaryChunkReader#primitive reads within and across chunks', () => {
  const reader = new BinaryChunkReader();
  reader.write(CHUNK_1);
  reader.write(CHUNK_2);

  expect(reader.readByte()).toBe(1);
  expect(reader.readUint16LE()).toBe(0x0302);
  expect(reader.readUint16LE()).toBe(0x0504);
  expect(reader.readByte()).toBe(6);
});

test('BinaryChunkReader#preserves ArrayBufferView byte offsets', () => {
  const source = new Uint8Array([0, 10, 20, 30, 40, 0]);
  const reader = new BinaryChunkReader();
  reader.write(source.subarray(1, 5));

  expect(reader.readUint32LE()).toBe(0x281e140a);
});

test('BinaryChunkReader#checkpoint and restore', () => {
  const reader = new BinaryChunkReader();
  reader.write(CHUNK_1);
  reader.write(CHUNK_2);

  expect(reader.readByte()).toBe(1);
  const checkpoint = reader.checkpoint();
  expect(reader.readUint32LE()).toBe(0x05040302);
  reader.restore(checkpoint);
  expect(reader.readUint32LE()).toBe(0x05040302);
});

test('BinaryChunkReader#readInto across chunks', () => {
  const reader = new BinaryChunkReader();
  reader.write(CHUNK_1);
  reader.write(CHUNK_2);
  reader.skip(2);
  const target = new Uint8Array(4);

  reader.readInto(target, 0, 4);

  expect(target).toEqual(new Uint8Array([3, 4, 5, 6]));
});

test('BinaryChunkReader#getDataView returns aligned contiguous views', () => {
  const source = new Uint8Array([0, 1, 2, 3, 4]);
  const reader = new BinaryChunkReader();
  reader.write(source.subarray(1, 5));

  const dataView = reader.getDataView(4);

  expect(dataView?.byteOffset).toBe(source.byteOffset + 1);
  expect(dataView?.byteLength).toBe(4);
  expect(dataView?.getUint32(0, true)).toBe(0x04030201);
});

test('BinaryChunkReader#getDataView copies only requested cross-chunk bytes', () => {
  const reader = new BinaryChunkReader();
  reader.write(CHUNK_1);
  reader.write(CHUNK_2);
  reader.skip(2);

  const dataView = reader.getDataView(3);

  expect(dataView?.byteOffset).toBe(0);
  expect(dataView?.byteLength).toBe(3);
  expect([dataView?.getUint8(0), dataView?.getUint8(1), dataView?.getUint8(2)]).toEqual([3, 4, 5]);
});

test('BinaryChunkReader#discardConsumed respects maxRewindBytes', () => {
  const reader = new BinaryChunkReader({maxRewindBytes: 2});
  reader.write(CHUNK_1);
  reader.write(CHUNK_2);
  reader.write(CHUNK_3);

  reader.skip(4);
  reader.discardConsumed();
  expect(reader.arrayBuffers.length).toBe(3);

  reader.skip(1);
  reader.discardConsumed();
  expect(reader.arrayBuffers.length).toBe(2);
});
