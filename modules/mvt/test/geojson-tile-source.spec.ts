// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

/* eslint-disable no-console */

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {GeoJSONTileSource} from '@loaders.gl/mvt';

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

test('GeoJSONTileSource#getTile#us-states.json', async (t) => {
  const log = console.log;
  console.log = function () {};

  const geojson = await getJSON('us-states.json');
  const source = new GeoJSONTileSource(geojson, {debug: 2});

  t.same(
    source.getTileSync({zoom: 7, x: 37, y: 48})?.features,
    await getJSON('us-states-z7-37-48.json'),
    'z7-37-48'
  );
  // t.same(source.getTileSync({zoom: '7', x: '37' y:,} '48')?.features, getJSON('us-states-z7-37-48.json'), 'z, x, y as strings');

  t.same(
    source.getTileSync({zoom: 9, x: 148, y: 192})?.features,
    square,
    'z9-148-192 (clipped square)'
  );
  // t.same(source.getTileSync({zoom: 11, x: 592, y: 768})?.features, square, 'z11-592-768 (clipped square)');

  t.equal(source.getTileSync({zoom: 11, x: 800, y: 400}), null, 'non-existing tile');
  t.equal(source.getTileSync({zoom: -5, x: 123.25, y: 400.25}), null, 'invalid tile');
  t.equal(source.getTileSync({zoom: 25, x: 200, y: 200}), null, 'invalid tile');

  console.log = log;

  t.equal(source.total, 37);

  t.end();
});

test('GeoJSONTileSource#getTile#unbuffered tile left/right edges', (t) => {
  const source = new GeoJSONTileSource(
    {
      type: 'LineString',
      coordinates: [
        [0, 90],
        [0, -90]
      ]
    },
    {
      buffer: 0
    }
  );

  t.same(source.getTileSync({zoom: 2, x: 1, y: 1}), null);
  t.same(source.getTileSync({zoom: 2, x: 2, y: 1})?.features, [
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

test('GeoJSONTileSource#getTile#unbuffered tile top/bottom edges', (t) => {
  const source = new GeoJSONTileSource(
    {
      type: 'LineString',
      coordinates: [
        [-90, 66.51326044311188],
        [90, 66.51326044311188]
      ]
    },
    {
      buffer: 0
    }
  );

  t.same(source.getTileSync({zoom: 2, x: 1, y: 0})?.features, [
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
  t.same(source.getTileSync({zoom: 2, x: 1, y: 1})?.features, []);
  t.end();
});

test('GeoJSONTileSource#getTile#polygon clipping on the boundary', (t) => {
  const source = new GeoJSONTileSource(
    {
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
    },
    {
      buffer: 1024
    }
  );

  t.same(source.getTileSync({zoom: 5, x: 19, y: 9})?.features, [
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

async function getJSON(name) {
  const response = await fetchFile(`${DATA_PATH}/${name}`);
  const json = await response.json();
  return json;
}
