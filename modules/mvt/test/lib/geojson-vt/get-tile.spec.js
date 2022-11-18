// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

/* eslint-disable no-console */

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {GeoJSONTiler} from '@loaders.gl/mvt';

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

test('GeoJSONVT#getTile#us-states.json', async (t) => {
  const log = console.log;
  console.log = function () {};

  const geojson = await getJSON('us-states.json');
  const index = new GeoJSONTiler(geojson, {debug: 2});

  t.same(index.getTile(7, 37, 48).features, await getJSON('us-states-z7-37-48.json'), 'z7-37-48');
  // t.same(index.getTile('7', '37', '48').features, getJSON('us-states-z7-37-48.json'), 'z, x, y as strings');

  t.same(index.getTile(9, 148, 192).features, square, 'z9-148-192 (clipped square)');
  // t.same(index.getTile(11, 592, 768).features, square, 'z11-592-768 (clipped square)');

  t.equal(index.getTile(11, 800, 400), null, 'non-existing tile');
  t.equal(index.getTile(-5, 123.25, 400.25), null, 'invalid tile');
  t.equal(index.getTile(25, 200, 200), null, 'invalid tile');

  console.log = log;

  t.equal(index.total, 37);

  t.end();
});

test('GeoJSONVT#getTile#unbuffered tile left/right edges', (t) => {
  const index = new GeoJSONTiler(
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

  t.same(index.getTile(2, 1, 1), null);
  t.same(index.getTile(2, 2, 1).features, [
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

test('GeoJSONVT#getTile#unbuffered tile top/bottom edges', (t) => {
  const index = new GeoJSONTiler(
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

  t.same(index.getTile(2, 1, 0).features, [
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
  t.same(index.getTile(2, 1, 1).features, []);
  t.end();
});

test('GeoJSONVT#getTile#polygon clipping on the boundary', (t) => {
  const index = new GeoJSONTiler(
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

  t.same(index.getTile(5, 19, 9).features, [
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
