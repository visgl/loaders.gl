// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  fetchExampleData,
  runFixedFrameExample
} from '../../../../examples-experimental/tile-matrix-fixed-frame/example.mjs';

test('fixed UTM frame requests only covered native matrix URLs through the actual OGC source', async () => {
  const fetcher = vi.fn((url: RequestInfo | URL, _options?: RequestInit) => fetchExampleData(url));
  const signal = new AbortController().signal;
  const {tiles, content} = await runFixedFrameExample(fetcher, signal);
  expect(
    tiles.map(tile => ({index: tile.index, matrix: tile.tileMatrix, size: tile.tileSize}))
  ).toEqual([
    {index: {x: 0, y: 1, z: 1}, matrix: 'survey:detail', size: [256, 128]},
    {index: {x: 0, y: 2, z: 1}, matrix: 'survey:detail', size: [256, 128]}
  ]);
  expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual([
    'https://example.invalid/ogc',
    'https://example.invalid/ogc/tiles/survey%3Adetail/1/0',
    'https://example.invalid/ogc/tiles/survey%3Adetail/2/0'
  ]);
  for (const [, options] of fetcher.mock.calls.slice(1)) expect(options?.signal).toBe(signal);
  expect(content.map(buffer => [...new Uint8Array(buffer)])).toEqual([
    [1, 2, 3],
    [1, 2, 3]
  ]);
});
