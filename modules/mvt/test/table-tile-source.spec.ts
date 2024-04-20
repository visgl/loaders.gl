// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import test from 'tape-promise/tape';
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
    type: 3,
    tags: {name: 'Pennsylvania', density: 284.3},
    id: '42'
  }
];

test('TableTileSource#getTile#us-states.json', async (t) => {
  const geojson = await loadGeoJSONTable('us-states.json');
  const source = new TableTileSource(geojson, {coordinates: 'wgs84'}); // , debug: 2});
  await source.ready;

  // Check that tiles are correctly generated

  let tile = source.getRawTile({z: 7, x: 37, y: 48});
  const expected = await loadGeoJSONTable('us-states-z7-37-48.json');
  t.same(tile?.features, expected.features, 'z7-37-48');

  tile = source.getRawTile({z: 9, x: 148, y: 192});
  t.same(tile?.features, square, 'z9-148-192 (clipped square)');

  // t.same(source.getRawTile({z: 11, x: 592, y: 768})?.features, square, 'z11-592-768 (clipped square)');

  // Check non-existing tiles (no geometry in these tile indices => no tile generated)

  tile = source.getRawTile({z: 11, x: 800, y: 400});
  t.equal(tile, null, 'non-existing tile');

  tile = source.getRawTile({z: -5, x: 123.25, y: 400.25});
  t.equal(tile, null, 'invalid tile');

  tile = source.getRawTile({z: 25, x: 200, y: 200});
  t.equal(tile, null, 'invalid tile');

  // Check total number of tiles generated

  t.equal(source.total, 37);

  t.end();
});

test('TableTileSource#getTile#unbuffered tile left/right edges', async (t) => {
  const geojson = makeGeoJSONTable({
    type: 'LineString',
    coordinates: [
      [0, 90],
      [0, -90]
    ]
  });
  const source = new TableTileSource(geojson, {
    coordinates: 'local',
    buffer: 0
  });
  await source.ready;

  let tile = source.getRawTile({z: 2, x: 1, y: 1});
  t.same(tile, null);
  tile = source.getRawTile({z: 2, x: 2, y: 1});
  t.same(tile?.features, [
    {
      geometry: [
        [
          [0, 0],
          [0, 4096]
        ]
      ],
      type: 2,
      tags: null
    }
  ]);
  t.end();
});

test('TableTileSource#getTile#unbuffered tile top/bottom edges', async (t) => {
  const geojson = makeGeoJSONTable({
    type: 'LineString',
    coordinates: [
      [-90, 66.51326044311188],
      [90, 66.51326044311188]
    ]
  });
  const source = new TableTileSource(geojson, {
    coordinates: 'local',
    buffer: 0
  });
  await source.ready;

  t.same(source.getRawTile({z: 2, x: 1, y: 0})?.features, [
    {
      geometry: [
        [
          [0, 4096],
          [4096, 4096]
        ]
      ],
      type: 2,
      tags: null
    }
  ]);
  t.same(source.getRawTile({z: 2, x: 1, y: 1})?.features, []);
  t.end();
});

test('TableTileSource#getTile#polygon clipping on the boundary', async (t) => {
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
  const source = new TableTileSource(geojson, {
    coordinates: 'local',
    buffer: 1024
  });
  await source.ready;

  t.same(source.getRawTile({z: 5, x: 19, y: 9})?.features, [
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
      type: 3,
      tags: null
    }
  ]);

  t.end();
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
