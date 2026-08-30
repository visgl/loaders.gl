// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

const crunchMocks = vi.hoisted(() => ({
  format: 0,
  width: 4,
  height: 4,
  levels: 2,
  nextOffset: 16,
  free: vi.fn(),
  heap: new Uint8Array(4096)
}));

vi.mock('../src/lib/parsers/crunch-module-loader', () => ({
  loadCrunchModule: vi.fn(async () => ({
    HEAPU8: crunchMocks.heap,
    _malloc: (size: number) => {
      const offset = crunchMocks.nextOffset;
      crunchMocks.nextOffset += size + 16;
      return offset;
    },
    _free: crunchMocks.free,
    _crn_get_dxt_format: () => crunchMocks.format,
    _crn_get_levels: () => crunchMocks.levels,
    _crn_get_width: () => crunchMocks.width,
    _crn_get_height: () => crunchMocks.height,
    _crn_decompress: (
      _source: number,
      _sourceSize: number,
      destination: number,
      destinationSize: number
    ) => crunchMocks.heap.fill(7, destination, destination + destinationSize)
  }))
}));

import {parseCrunch} from '../src/lib/parsers/parse-crunch';

beforeEach(() => {
  crunchMocks.format = 0;
  crunchMocks.width = 4;
  crunchMocks.height = 4;
  crunchMocks.levels = 2;
  crunchMocks.free.mockClear();
  crunchMocks.heap.fill(0);
});

test('parseCrunch copies unaligned inputs and extracts DXT1 mip levels', async () => {
  const levels = await parseCrunch(new Uint8Array([1, 2, 3, 4, 5]).buffer, {});

  expect(levels).toHaveLength(2);
  expect(levels.map(level => [level.width, level.height, level.data.length])).toEqual([
    [4, 4, 8],
    [2, 2, 8]
  ]);
  expect(levels.every(level => level.textureFormat === 'bc1-rgb-unorm-webgl')).toBe(true);
  expect(Array.from(levels[0].data)).toEqual(new Array(8).fill(7));
});

test('parseCrunch reallocates larger DXT5 output buffers and frees source allocations', async () => {
  crunchMocks.format = 2;
  crunchMocks.width = 16;
  crunchMocks.height = 16;
  crunchMocks.levels = 1;

  const levels = await parseCrunch(new Uint8Array(8).buffer, {});

  expect(levels[0].textureFormat).toBe('bc3-rgba-unorm');
  expect(levels[0].data.length).toBe(256);
  expect(crunchMocks.free.mock.calls.length).toBeGreaterThanOrEqual(1);
});

test('parseCrunch rejects unsupported Crunch encodings', async () => {
  crunchMocks.format = -1;
  await expect(parseCrunch(new Uint8Array(4).buffer, {})).rejects.toThrow('Unsupported format');
});
