// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateWriter} from 'test/common/conformance';
import * as arrow from 'apache-arrow';
import {ZstdCodec} from 'zstd-codec';
import {parseSync, encode, encodeSync} from '@loaders.gl/core';
import {ArrowWriter} from '@loaders.gl/arrow';
import {ArrowLoader} from '@loaders.gl/arrow/bundled';
test('ArrowWriter#writer conformance', () => {
  validateWriter(ArrowWriter, 'ArrowWriter');
});
test('ArrowWriter#encode', async () => {
  const LENGTH = 2000;
  const rainAmounts = Float32Array.from({length: LENGTH}, () =>
    Number((Math.random() * 20).toFixed(1))
  );
  const rainDates = Array.from(
    {length: LENGTH},
    (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
  );
  const arraysData = [
    {array: rainAmounts, name: 'precipitation', type: 0},
    {array: rainDates, name: 'date', type: 1}
  ];
  const arrayBuffer = await encode(arraysData, ArrowWriter);
  expect(arrayBuffer).toBeTruthy();
  const table = parseSync(arrayBuffer, ArrowLoader);
  expect(table).toBeTruthy();
  expect(table.shape).toBe('columnar-table');
  if (table.shape === 'columnar-table') {
    expect(table.data.precipitation).toBeTruthy();
    expect(table.data.precipitation.length).toBe(LENGTH);
  }
});
test('ArrowWriter#encodeSync writes an Arrow IPC file / Feather V2 container', () => {
  const arraysData = [
    {array: Int32Array.from([1, 2, 3]), name: 'id', type: 0},
    {array: ['alpha', 'beta', 'gamma'], name: 'name', type: 1}
  ];
  const arrayBuffer = encodeSync(arraysData, ArrowWriter, {
    arrow: {container: 'file'}
  });
  const bytes = new Uint8Array(arrayBuffer);
  const magic = new TextEncoder().encode('ARROW1');

  expect(bytes.subarray(0, magic.length)).toEqual(magic);
  expect(bytes.subarray(bytes.length - magic.length)).toEqual(magic);
  expect(parseSync(arrayBuffer, ArrowLoader).shape).toBe('columnar-table');
});
test('ArrowWriter writes LZ4 and Zstandard compressed Feather V2 files', async () => {
  const compressionAPI = arrow as unknown as {
    CompressionType?: {LZ4_FRAME?: number; ZSTD?: number};
    compressionRegistry?: {
      get: (compressionType: number) => {
        encode?: (data: Uint8Array) => Uint8Array;
        decode?: (data: Uint8Array) => Uint8Array;
      } | null;
      set: (
        compressionType: number,
        codec: {
          encode?: (data: Uint8Array) => Uint8Array;
          decode?: (data: Uint8Array) => Uint8Array;
        }
      ) => void;
    };
  };
  if (
    !compressionAPI.compressionRegistry ||
    typeof compressionAPI.CompressionType?.LZ4_FRAME !== 'number' ||
    typeof compressionAPI.CompressionType.ZSTD !== 'number'
  ) {
    return;
  }

  const arraysData = [
    {array: Int32Array.from({length: 4096}, (_, index) => index % 8), name: 'id', type: 0},
    {
      array: Array.from({length: 4096}, (_, index) => `category-${index % 4}`),
      name: 'category',
      type: 1
    }
  ];
  const uncompressed = encodeSync(arraysData, ArrowWriter, {arrow: {container: 'file'}});
  compressionAPI.compressionRegistry.set(compressionAPI.CompressionType.LZ4_FRAME, {});
  const lz4 = await encode(arraysData, ArrowWriter, {
    arrow: {container: 'file', compression: 'lz4'}
  });
  const lz4WithRegisteredEncoder = await encode(arraysData, ArrowWriter, {
    arrow: {container: 'file', compression: 'lz4'}
  });
  const lz4Sync = encodeSync(arraysData, ArrowWriter, {
    arrow: {container: 'file', compression: 'lz4'}
  });
  compressionAPI.compressionRegistry.set(compressionAPI.CompressionType.ZSTD, {});
  expect(() =>
    encodeSync(arraysData, ArrowWriter, {
      arrow: {container: 'file', compression: 'zstd'}
    })
  ).toThrow(/use encode\(\) instead of encodeSync\(\)/);
  await expect(
    encode(arraysData, ArrowWriter, {
      arrow: {container: 'file', compression: 'zstd'}
    })
  ).rejects.toThrow(/requires a 'zstd-codec' module/);
  const zstd = await encode(arraysData, ArrowWriter, {
    modules: {'zstd-codec': ZstdCodec},
    arrow: {container: 'file', compression: 'zstd'}
  });

  expect(lz4.byteLength).toBeLessThan(uncompressed.byteLength);
  expect(lz4WithRegisteredEncoder.byteLength).toBe(lz4.byteLength);
  expect(lz4Sync.byteLength).toBeLessThan(uncompressed.byteLength);
  expect(zstd.byteLength).toBeLessThan(uncompressed.byteLength);
  expect(parseSync(lz4, ArrowLoader).shape).toBe('columnar-table');
  expect(parseSync(lz4Sync, ArrowLoader).shape).toBe('columnar-table');
  expect(parseSync(zstd, ArrowLoader).shape).toBe('columnar-table');
});
