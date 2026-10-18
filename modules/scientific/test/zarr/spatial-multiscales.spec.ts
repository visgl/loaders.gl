// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoZarrRasterSource} from '@loaders.gl/scientific/zarr';
import {getSpatialMultiscaleLevels} from '../../src/zarr/lib/spatial-multiscales';

const BASE_URL = 'https://example.com/spatial.zarr';

/** Builds tiny in-memory array metadata; no sample chunks are supplied. */
function createSource(
  overrides: Record<string, unknown> = {},
  grouped = false,
  groupOverrides: Record<string, unknown> = {}
): {source: GeoZarrRasterSource; requests: string[]} {
  const assets = ['fine', 'overview'];
  const rootAttributes = {
    'proj:code': 'EPSG:32610',
    multiscales: {layout: assets.map(asset => ({asset}))},
    ...groupOverrides
  };
  const documents: Record<string, unknown> = {
    '/zarr.json': {zarr_format: 3, node_type: 'group', attributes: rootAttributes}
  };
  for (const [index, asset] of assets.entries()) {
    const attributes = {
      'spatial:dimensions': ['y', 'x'],
      'spatial:transform': index === 0 ? [2, 0, 100, 0, -3, 200] : [5, 0, 100, 0, -7, 200],
      ...(index === 1 ? overrides : {})
    };
    if (grouped) {
      documents[`/${asset}/zarr.json`] = {zarr_format: 3, node_type: 'group', attributes};
    }
    documents[`/${asset}${grouped ? '/values' : ''}/zarr.json`] = {
      zarr_format: 3,
      node_type: 'array',
      shape: [2, index ? 3 : 5, index ? 2 : 4],
      dimension_names: ['time', 'x', 'y'],
      data_type: 'uint8',
      chunk_grid: {name: 'regular', configuration: {chunk_shape: [1, 2, 3]}},
      chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
      codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
      fill_value: 0,
      attributes: grouped ? {} : attributes
    };
  }
  const requests: string[] = [];
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    requests.push(url);
    const document = documents[url.slice(BASE_URL.length)];
    return document ? Response.json(document) : new Response(null, {status: 404});
  }) as typeof fetch;
  return {
    source: new GeoZarrRasterSource(BASE_URL, {
      zarr: {requireConsolidatedMetadata: false},
      geozarr: {array: `fine${grouped ? '/values' : ''}`, defaultSelection: {time: 1}},
      core: {fetch: fetcher}
    }),
    requests
  };
}

test.each([
  false,
  true
])('GeoZarr describes native chunk geometry across multiscales (groups=%s)', async grouped => {
  const {source, requests} = createSource({}, grouped);
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.matrixIds).toEqual(['fine', 'overview']);
  expect(metadata.tileGrid?.tileMatrixSet?.matrices).toEqual([
    {
      id: 'fine',
      resolution: 2,
      resolutionY: 3,
      origin: [100, 200],
      cornerOfOrigin: 'topLeft',
      tileSize: [2, 3],
      matrixSize: [3, 2]
    },
    {
      id: 'overview',
      resolution: 5,
      resolutionY: 7,
      origin: [100, 200],
      cornerOfOrigin: 'topLeft',
      tileSize: [2, 3],
      matrixSize: [2, 1]
    }
  ]);
  expect(metadata.levels?.[1].metadata?.dimensions).toEqual(['time', 'x', 'y']);
  expect(metadata.levels?.[1].metadata?.selectionDimensions).toEqual([
    {name: 'time', size: 2, defaultIndex: 1}
  ]);
  expect(metadata.array).toBe(`fine${grouped ? '/values' : ''}`);
  expect(
    requests.every(url => /\/(?:zarr\.json|\.z(?:array|group|attrs|metadata))$/.test(url))
  ).toBe(true);
  const previousCount = requests.length;
  expect(await source.getMetadata()).toBe(metadata);
  expect(requests).toHaveLength(previousCount);
});

test.each([
  {'spatial:transform': [2, 1, 0, 0, -2, 0]},
  {'spatial:transform': [-2, 0, 0, 0, -2, 0]},
  {'spatial:transform': null},
  {'proj:code': 'EPSG:4326'},
  {'proj:code': null}
])('GeoZarr retains advertised levels without inventing complete geometry: %j', async overrides => {
  const {source, requests} = createSource(overrides);
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.tileMatrixSet).toBeUndefined();
  expect(metadata.levels?.map(level => level.id)).toEqual(['fine', 'overview']);
  expect(
    requests.every(url => /\/(?:zarr\.json|\.z(?:array|group|attrs|metadata))$/.test(url))
  ).toBe(true);
});

test('GeoZarr normalizes node and south-up level origins', async () => {
  const {source} = createSource({
    'spatial:registration': 'node',
    'spatial:transform': [5, 0, 100, 0, 7, 200]
  });
  const matrix = (await source.getMetadata()).tileGrid?.tileMatrixSet?.matrices[1];
  expect(matrix?.origin).toEqual([97.5, 196.5]);
  expect(matrix?.cornerOfOrigin).toBe('bottomLeft');
});

test.each([
  '../escape',
  '/absolute',
  'https://other/store',
  'a\\b',
  'a/%2e%2e',
  'a?query',
  ''
])('Reject unsafe multiscale asset %s', asset => {
  expect(() => getSpatialMultiscaleLevels({multiscales: {layout: [{asset}]}}, 'fine')).toThrow(
    /relative child/
  );
});

test('Native OME metadata and unrelated or ambiguous layouts are not recast as spatial multiscales', () => {
  expect(getSpatialMultiscaleLevels({multiscales: [{datasets: [{path: '0'}]}]}, '0')).toEqual([]);
  expect(getSpatialMultiscaleLevels({multiscales: {layout: [{asset: 'other'}]}}, 'fine')).toEqual(
    []
  );
  expect(
    getSpatialMultiscaleLevels(
      {multiscales: {layout: [{asset: 'a'}, {asset: 'a/b'}]}},
      'a/b/values'
    )
  ).toEqual([]);
  expect(() =>
    getSpatialMultiscaleLevels({multiscales: {layout: [{asset: 'a'}, {asset: 'a'}]}}, 'a')
  ).toThrow(/Duplicate/);
});
