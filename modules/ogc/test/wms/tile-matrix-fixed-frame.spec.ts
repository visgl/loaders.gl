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

test('shared Tileset2D requests canonical native tiles through the actual OGC source', async () => {
  const {MATRIX_SET, FRAME} = await import(
    '../../../../examples-experimental/tile-matrix-fixed-frame/example.mjs'
  );
  const {OGCAPITilesSource} = await import('@loaders.gl/ogc/wms');
  const {Tileset2D, createTileMatrixTileset2DAdapter} = await import('@loaders.gl/tiles');
  const fetcher = vi.fn((url: RequestInfo | URL, _options?: RequestInit) => fetchExampleData(url));
  const source = new OGCAPITilesSource('https://example.invalid/ogc', {
    core: {fetch: fetcher},
    'ogc-api': {
      tileTemplate: 'https://example.invalid/ogc/tiles/{tileMatrix}/{tileRow}/{tileCol}',
      tileMatrixSet: MATRIX_SET,
      tileMatrixSetLimits: [
        {tileMatrix: 'survey:detail', minTileRow: 1, maxTileRow: 2, minTileCol: 1, maxTileCol: 1}
      ]
    }
  });
  const metadata = await source.getMetadata();
  const adapter = createTileMatrixTileset2DAdapter(metadata.tileGrid!, {
    cacheNamespace: 'offline-utm'
  });
  const tileset = Tileset2D.fromTileSource(source, {adapter});
  const indices = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const tiles = indices.map(index => tileset.getTile(index, true));
  const content = await Promise.all(tiles.map(tile => tile.data));
  const tileRequests = fetcher.mock.calls.filter(([url]) => String(url).includes('/ogc/tiles/'));
  expect(tileRequests.map(([url]) => String(url))).toEqual([
    'https://example.invalid/ogc/tiles/survey%3Adetail/1/0',
    'https://example.invalid/ogc/tiles/survey%3Adetail/2/0'
  ]);
  expect(tiles.map(tile => [tile.tileMatrix, tile.tileSize, tile.parent])).toEqual([
    ['survey:detail', [256, 128], null],
    ['survey:detail', [256, 128], null]
  ]);
  expect(content.map(buffer => [...new Uint8Array(buffer as ArrayBuffer)])).toEqual([
    [1, 2, 3],
    [1, 2, 3]
  ]);
  for (const [, options] of tileRequests) expect(options?.signal).toBeInstanceOf(AbortSignal);
  tileset.finalize();
});
