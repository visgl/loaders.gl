// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {Feature} from '@loaders.gl/schema';

import {MLTSourceLoader} from '@loaders.gl/mlt';
import {MLTLoaderWithParser as MLTLoader} from '../src/mlt-loader-with-parser';
import {getURLFromTemplate} from '../src/mlt-source-loader';

test('MLTSourceLoader#testURL', t => {
  t.true(MLTSourceLoader.testURL('https://server/{z}/{x}/{y}.mlt'));
  t.true(MLTSourceLoader.testURL('https://server/{z}/{x}/{-y}.mlt'));
  t.true(MLTSourceLoader.testURL('https://server/tiles-mlt/plain'));
  t.true(MLTSourceLoader.testURL('https://server/tiles.mlt'));
  t.end();
});

test('MLTSourceLoader#getURLFromTemplate', t => {
  t.is(
    getURLFromTemplate('https://server/{z}/{x}/{y}', 1, 2, 3, '.mlt'),
    'https://server/3/1/2.mlt'
  );
  t.is(
    getURLFromTemplate('https://server/{z}/{x}/{y}.mlt', 1, 2, 3, ''),
    'https://server/3/1/2.mlt'
  );
  t.is(
    getURLFromTemplate('https://server/{z}/{x}/{y}', 1, 2, 3, '.mvt'),
    'https://server/3/1/2.mvt'
  );
  t.is(getURLFromTemplate('https://server/{z}/{x}/{y}.mvt', 1, 2, 3), 'https://server/3/1/2.mvt');
  t.is(
    getURLFromTemplate('https://server/{z}/{x}/{y}.mvt', 1, 2, 3, '.mlt'),
    'https://server/3/1/2.mvt'
  );
  t.end();
});

test('MLTTileSource#getTileURL', t => {
  const tmsSource = MLTSourceLoader.createDataSource('https://example.com/tiles', {});
  t.equal(tmsSource.getTileURL(1, 2, 3), 'https://example.com/tiles/3/1/2.mlt');

  const templateSource = MLTSourceLoader.createDataSource('https://example.com/tiles/{z}/{x}/{y}', {
    mlt: {extension: '.mvt'}
  });
  t.equal(templateSource.getTileURL(1, 2, 3), 'https://example.com/tiles/3/1/2.mvt');

  const templateSourceWithExt = MLTSourceLoader.createDataSource(
    'https://example.com/tiles/{z}/{x}/{y}',
    {mlt: {extension: '.mvt'}}
  );
  t.equal(templateSourceWithExt.getTileURL(1, 2, 3), 'https://example.com/tiles/3/1/2.mvt');

  t.end();
});

test('MLTTileSource#getTileData returns Feature[] by default', async t => {
  const feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [0, 0]},
    properties: {name: 'test'}
  } as Feature;

  const originalParse = MLTLoader.parse;
  const parseOptions: {options?: unknown} = {};

  MLTLoader.parse = (async (arrayBuffer: ArrayBuffer, options?: unknown) => {
    parseOptions.options = options;
    return [feature];
  }) as unknown as typeof MLTLoader.parse;

  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {});
  source.fetch = async () => new Response(new ArrayBuffer(8));
  try {
    const tile = await source.getTileData({
      index: {x: 1, y: 2, z: 3},
      id: '1/2/3',
      bbox: {west: 0, north: 0, east: 0, south: 0}
    });
    t.equal((parseOptions.options as {mlt?: {shape?: string}})?.mlt?.shape, 'geojson');
    t.equal((parseOptions.options as {mlt?: {coordinates?: string}})?.mlt?.coordinates, 'wgs84');
    t.deepEqual(tile, [feature]);
  } finally {
    MLTLoader.parse = originalParse;
  }

  t.end();
});

test('MLTTileSource#supports table shape by converting to Feature[]', async t => {
  const feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {name: 'table'}
  } as Feature;

  const originalParse = MLTLoader.parse;
  MLTLoader.parse = (async () => ({
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features: [feature]
  })) as unknown as typeof MLTLoader.parse;

  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {
    mlt: {shape: 'geojson-table'}
  });
  source.fetch = async () => new Response(new ArrayBuffer(8));
  try {
    const tile = await source.getTileData({
      index: {x: 1, y: 2, z: 3},
      id: '1/2/3',
      bbox: {west: 0, north: 0, east: 0, south: 0}
    });
    t.deepEqual(tile, [feature]);
  } finally {
    MLTLoader.parse = originalParse;
  }

  t.end();
});
