// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Feature} from '@loaders.gl/schema';

import {MLTSourceLoader} from '@loaders.gl/mlt';
import {MLTLoaderWithParser as MLTLoader} from '../src/mlt-loader-with-parser';
import {getURLFromTemplate} from '../src/mlt-source-loader';

test('MLTSourceLoader#testURL', () => {
  expect(MLTSourceLoader.testURL('https://server/{z}/{x}/{y}.mlt')).toBe(true);
  expect(MLTSourceLoader.testURL('https://server/{z}/{x}/{-y}.mlt')).toBe(true);
  expect(MLTSourceLoader.testURL('https://server/tiles-mlt/plain')).toBe(true);
  expect(MLTSourceLoader.testURL('https://server/tiles.mlt')).toBe(true);
  expect(MLTSourceLoader.testURL('https://server/tiles.json')).toBe(false);
});

test('MLTSourceLoader#getURLFromTemplate', () => {
  expect(getURLFromTemplate('https://server/{z}/{x}/{y}', 1, 2, 3, '.mlt')).toBe(
    'https://server/3/1/2.mlt'
  );
  expect(getURLFromTemplate('https://server/{z}/{x}/{y}.mlt', 1, 2, 3, '')).toBe(
    'https://server/3/1/2.mlt'
  );
  expect(getURLFromTemplate('https://server/{z}/{x}/{y}', 1, 2, 3, '.mvt')).toBe(
    'https://server/3/1/2.mvt'
  );
  expect(getURLFromTemplate('https://server/{z}/{x}/{y}.mvt', 1, 2, 3)).toBe(
    'https://server/3/1/2.mvt'
  );
  expect(getURLFromTemplate('https://server/{z}/{x}/{y}.mvt', 1, 2, 3, '.mlt')).toBe(
    'https://server/3/1/2.mvt'
  );
});

test('MLTTileSource#getTileURL', () => {
  const tmsSource = MLTSourceLoader.createDataSource('https://example.com/tiles', {});
  expect(tmsSource.getTileURL(1, 2, 3)).toBe('https://example.com/tiles/3/1/2.mlt');

  const templateSource = MLTSourceLoader.createDataSource('https://example.com/tiles/{z}/{x}/{y}', {
    mlt: {extension: '.mvt'}
  });
  expect(templateSource.getTileURL(1, 2, 3)).toBe('https://example.com/tiles/3/1/2.mvt');

  const templateSourceWithExt = MLTSourceLoader.createDataSource(
    'https://example.com/tiles/{z}/{x}/{y}',
    {mlt: {extension: '.mvt'}}
  );
  expect(templateSourceWithExt.getTileURL(1, 2, 3)).toBe('https://example.com/tiles/3/1/2.mvt');
});

test('MLTTileSource#getSchema and default metadata', async () => {
  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {
    core: {attributions: ['base']}
  });

  expect(await source.getSchema()).toEqual({fields: [], metadata: {}});
  expect(await source.getMetadata()).toEqual({minZoom: 0, maxZoom: 30, attributions: ['base']});
});

test('MLTTileSource#reads metadata with both zoom key styles', async () => {
  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {
    core: {attributions: ['base']},
    mlt: {metadataUrl: 'data:application/json,%7B%7D'}
  });
  source.fetch = async () =>
    new Response(JSON.stringify({minzoom: 2, maxZoom: 12, attributions: ['server'], name: 'demo'}));

  await expect(source.getMetadata()).resolves.toEqual({
    minzoom: 2,
    maxZoom: 12,
    minZoom: 2,
    attributions: ['base', 'server'],
    name: 'demo'
  });
});

test('MLTTileSource#falls back when metadata fetch or JSON parsing fails', async () => {
  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {
    mlt: {metadataUrl: 'data:application/json,%7B%7D'}
  });
  source.fetch = async () => new Response('missing', {status: 404, statusText: 'Not Found'});
  await expect(source.getMetadata()).resolves.toEqual({minZoom: 0, maxZoom: 30, attributions: []});

  source.fetch = async () => new Response('{');
  await expect(source.getMetadata()).resolves.toEqual({minZoom: 0, maxZoom: 30, attributions: []});
});

test('MLTTileSource#getTile returns data or null for HTTP responses', async () => {
  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {});
  source.fetch = async () => new Response(new Uint8Array([1, 2, 3]));
  expect(await source.getTile({x: 1, y: 2, z: 3})).toEqual(new Uint8Array([1, 2, 3]).buffer);

  source.fetch = async () => new Response('missing', {status: 404, statusText: 'Not Found'});
  expect(await source.getTile({x: 1, y: 2, z: 3})).toBeNull();
});

test('MLTTileSource#getTileData returns Feature[] by default', async () => {
  const feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [0, 0]},
    properties: {name: 'test'}
  } as Feature;

  const originalParse = MLTLoader.parse;
  const parseOptions: {options?: unknown} = {};

  MLTLoader.parse = (async (arrayBuffer: ArrayBuffer, options?: unknown) => {
    parseOptions.options = options;
    return {shape: 'geojson-table', type: 'FeatureCollection', features: [feature]};
  }) as unknown as typeof MLTLoader.parse;

  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {});
  source.fetch = async () => new Response(new ArrayBuffer(8));
  try {
    const tile = await source.getTileData({
      index: {x: 1, y: 2, z: 3},
      id: '1/2/3',
      bbox: {west: 0, north: 0, east: 0, south: 0}
    });
    expect((parseOptions.options as {mlt?: {shape?: string}})?.mlt?.shape).toBe('geojson-table');
    expect((parseOptions.options as {mlt?: {coordinates?: string}})?.mlt?.coordinates).toBe(
      'wgs84'
    );
    expect(tile).toEqual([feature]);
  } finally {
    MLTLoader.parse = originalParse;
  }
});

test('MLTTileSource#supports table shape by converting to Feature[]', async () => {
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
    expect(tile).toEqual([feature]);
  } finally {
    MLTLoader.parse = originalParse;
  }
});

test('MLTTileSource#supports Arrow table shape', async () => {
  const originalParse = MLTLoader.parse;
  MLTLoader.parse = (async () => ({
    shape: 'arrow-table',
    schema: {fields: [], metadata: {geo: '{}'}},
    data: {numRows: 1}
  })) as unknown as typeof MLTLoader.parse;

  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {
    mlt: {shape: 'arrow-table'}
  });
  source.fetch = async () => new Response(new ArrayBuffer(8));
  try {
    const tile = await source.getTileData({
      index: {x: 1, y: 2, z: 3},
      id: '1/2/3',
      bbox: {west: 0, north: 0, east: 0, south: 0}
    });
    expect((tile as {shape?: string})?.shape).toBe('arrow-table');
  } finally {
    MLTLoader.parse = originalParse;
  }
});

test('MLTTileSource supports XYZ URLs and inverted-y templates', () => {
  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {
    mlt: {extension: '.tile'}
  });
  source.schema = 'xyz';
  expect(source.getTileURL(1, 2, 3)).toBe('https://example.com/tiles/1/2/3.tile');

  expect(getURLFromTemplate('https://example.com/{z}/{x}/{-y}?v=1', 1, 2, 3, '.mlt')).toBe(
    'https://example.com/3/1/5?v=1.mlt'
  );
});

test('MLTTileSource returns null for failed tile data and preserves metadata defaults', async () => {
  const source = MLTSourceLoader.createDataSource('https://example.com/tiles', {});
  source.fetch = async () => new Response('missing', {status: 500, statusText: 'Server Error'});

  await expect(
    source.getTileData({
      index: {x: 1, y: 2, z: 3},
      id: '1/2/3',
      bbox: {west: 0, north: 0, east: 0, south: 0}
    })
  ).resolves.toBeNull();
  await expect(source.getMetadata()).resolves.toEqual({
    minZoom: 0,
    maxZoom: 30,
    attributions: []
  });
});
