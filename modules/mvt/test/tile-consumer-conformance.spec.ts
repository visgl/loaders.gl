// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {resolveTableTileParameters} from '../src/lib/resolve-table-tile-parameters';
import {TableVectorTileSource} from '../src/table-tile-source-loader';
import {ArrowTableVectorTileSource} from '../src/arrow-table-tile-source-loader';
import {MVTTileSource} from '../src/mvt-source-loader';

test('MVT tile consumer preserves matrix ID and cancellation before decoding', async () => {
  const signal = new AbortController().signal;
  const getTile = vi.fn(async () => null);
  await MVTTileSource.prototype.getTileData.call(
    {getTile} as any,
    {index: {z: 0, x: 2, y: 1}, tileMatrix: '3', signal} as any
  );
  expect(getTile).toHaveBeenCalledWith({z: 0, x: 2, y: 1, layers: [], tileMatrix: '3', signal});
});

test('Generated table tiles preserve native level IDs before clipping and coordinate conversion', async () => {
  const source = new TableVectorTileSource(
    {shape: 'geojson-table', type: 'FeatureCollection', features: []},
    {table: {maxZoom: 3}}
  );
  await source.ready;
  const getProtoTile = vi.spyOn(source, 'getProtoTile').mockReturnValue(null);
  source.getTileSync({z: 0, x: 1, y: 1, tileMatrix: '2'});
  expect(getProtoTile.mock.calls[0][0]).toMatchObject({z: 2, tileMatrix: '2'});
  expect(() => source.getTileSync({z: 0, x: 0, y: 0, tileMatrix: '02'})).toThrow(/Unknown/);
  expect(resolveTableTileParameters({z: 2, x: 1, y: 1}, 3)).toEqual({z: 2, x: 1, y: 1});
  const controller = new AbortController();
  controller.abort();
  expect(() =>
    resolveTableTileParameters({z: 0, x: 0, y: 0, signal: controller.signal}, 3)
  ).toThrow(/aborted/);
});

test.each([
  TableVectorTileSource.prototype,
  ArrowTableVectorTileSource.prototype
])('Table consumer wrappers preserve matrix ID and cancellation (%j)', async prototype => {
  const signal = new AbortController().signal;
  const getTile = vi.fn(() => null);
  await prototype.getTileData.call(
    {ready: Promise.resolve(), getVectorTile: getTile, getTileSync: getTile} as any,
    {index: {z: 0, x: 2, y: 1}, tileMatrix: '3', signal} as any
  );
  expect(getTile).toHaveBeenCalledWith({z: 0, x: 2, y: 1, tileMatrix: '3', signal});
});
