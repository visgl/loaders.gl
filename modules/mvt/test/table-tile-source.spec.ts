// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {TableTileSource} from '@loaders.gl/mvt';
import {Feature, GeoJSONTable, Geometry} from '@loaders.gl/schema';

const DATA_PATH = '@loaders.gl/mvt/test/data/geojson-vt';

const square = [
  {
    geometry: [
      [
        [-64, 4160],
        [-64, -64],
        [4160, -64],
        [4160, 4160],
        [-64, 4160]
      ]
    ],
    simplifiedType: 3,
    tags: {name: 'Pennsylvania', density: 284.3},
    id: '42'
  }
];

test('TableTileSource#getTile#us-states.json', async () => {
  const geojson = await loadGeoJSONTable('us-states.json');
  const source = TableTileSource.createDataSource(geojson, {table: {coordinates: 'wgs84'}}); // , debug: 2});
  await source.ready;

  // Check that tiles are correctly generated

  let tile = source.getProtoTile({z: 7, x: 37, y: 48});
  const expected = await loadGeoJSONTable('us-states-z7-37-48.json');
  expect(tile?.protoFeatures, 'z7-37-48').toEqual(expected.features);

  tile = source.getProtoTile({z: 9, x: 148, y: 192});
  expect(tile?.protoFeatures, 'z9-148-192 (clipped square)').toEqual(square);

  // t.same(source.getProtoTile({z: 11, x: 592, y: 768})?.features, square, 'z11-592-768 (clipped square)');

  // Check non-existing tiles (no geometry in these tile indices => no tile generated)

  tile = source.getProtoTile({z: 11, x: 800, y: 400});
  expect(tile, 'non-existing tile').toBe(null);

  tile = source.getProtoTile({z: -5, x: 123.25, y: 400.25});
  expect(tile, 'invalid tile').toBe(null);

  tile = source.getProtoTile({z: 25, x: 200, y: 200});
  expect(tile, 'invalid tile').toBe(null);

  // Check total number of tiles generated

  const total = source.stats.get('total').count;
  expect(total).toBe(37);

  
});

test('TableTileSource#getTile#unbuffered tile left/right edges', async () => {
  const geojson = makeGeoJSONTable({
    type: 'LineString',
    coordinates: [
      [0, 90],
      [0, -90]
    ]
  });
  const source = TableTileSource.createDataSource(geojson, {
    table: {
      coordinates: 'local',
      buffer: 0
    }
  });
  await source.ready;

  let tile = source.getProtoTile({z: 2, x: 1, y: 1});
  expect(tile).toBe(null);
  tile = source.getProtoTile({z: 2, x: 2, y: 1});
  expect(tile?.protoFeatures).toEqual([
    {
      geometry: [
        [
          [0, 0],
          [0, 4096]
        ]
      ],
      simplifiedType: 2,
      tags: null
    }
  ]);
});

test('TableTileSource#getTile#unbuffered tile top/bottom edges', async () => {
  const geojson = makeGeoJSONTable({
    type: 'LineString',
    coordinates: [
      [-90, 66.51326044311188],
      [90, 66.51326044311188]
    ]
  });
  const source = TableTileSource.createDataSource(geojson, {
    table: {
      coordinates: 'local',
      buffer: 0
    }
  });
  await source.ready;

  expect(source.getProtoTile({z: 2, x: 1, y: 0})?.protoFeatures).toEqual([
    {
      geometry: [
        [
          [0, 4096],
          [4096, 4096]
        ]
      ],
      simplifiedType: 2,
      tags: null
    }
  ]);
  expect(source.getProtoTile({z: 2, x: 1, y: 1})?.protoFeatures).toEqual([]);
});

test('TableTileSource#getTile#polygon clipping on the boundary', async () => {
  const geojson = makeGeoJSONTable({
    type: 'Polygon',
    coordinates: [
      [
        [42.1875, 57.32652122521708],
        [47.8125, 57.32652122521708],
        [47.8125, 54.16243396806781],
        [42.1875, 54.16243396806781],
        [42.1875, 57.32652122521708]
      ]
    ]
  });
  const source = TableTileSource.createDataSource(geojson, {
    table: {
      coordinates: 'local',
      buffer: 1024
    }
  });
  await source.ready;

  expect(source.getProtoTile({z: 5, x: 19, y: 9})?.protoFeatures).toEqual([
    {
      geometry: [
        [
          [3072, 3072],
          [5120, 3072],
          [5120, 5120],
          [3072, 5120],
          [3072, 3072]
        ]
      ],
      simplifiedType: 3,
      tags: null
    }
  ]);
});

// HELPERS

function makeGeoJSONTable(geometry: Geometry): GeoJSONTable {
  const feature: Feature = {
    geometry,
    properties: null
  } as Feature;

  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features: [feature]
  };
}

async function loadGeoJSONTable(filename: string): Promise<GeoJSONTable> {
  const response = await fetchFile(`${DATA_PATH}/${filename}`);
  const json = await response.json();
  return Array.isArray(json)
    ? {shape: 'geojson-table', features: json, type: 'FeatureCollection'}
    : {shape: 'geojson-table', ...json};
}
