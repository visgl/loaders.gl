// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import {expect, test} from 'vitest';
import {WKTLoader} from '@loaders.gl/wkt';
import {setLoaderOptions, fetchFile, parseSync} from '@loaders.gl/core';

import fuzzer from 'fuzzer';

const GEOMETRYCOLLECTION_WKT_URL = '@loaders.gl/gis/test/data/wkt/geometrycollection.wkt';
const GEOMETRYCOLLECTION_GEOJSON_URL = '@loaders.gl/gis/test/data/wkt/geometrycollection.geojson';

setLoaderOptions({
  _workerType: 'test'
});

// eslint-disable-next-line max-statements
test('parseWKT', async () => {
  let response = await fetchFile(GEOMETRYCOLLECTION_WKT_URL);
  const GEOMETRYCOLLECTION_WKT = await response.text();

  response = await fetchFile(GEOMETRYCOLLECTION_GEOJSON_URL);
  const GEOMETRYCOLLECTION_GEOJSON = await response.json();

  expect(parseSync('POINT (0 1)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [0, 1]
  });
  expect(parseSync('POINT (1 1)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 1]
  });
  expect(parseSync('POINT(1 1)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 1]
  });
  expect(parseSync('POINT\n\r(1 1)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 1]
  });
  expect(parseSync('POINT(1.1 1.1)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1.1, 1.1]
  });
  expect(parseSync('point(1.1 1.1)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1.1, 1.1]
  });
  expect(parseSync('point(1 2 3)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 2, 3]
  });
  expect(parseSync('point(1 2 3 4)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 2, 3, 4]
  });
  expect(parseSync('SRID=3857;POINT (1 2 3)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 2, 3],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  expect(parseSync('LINESTRING (30 10, 10 30, 40 40)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  expect(parseSync('LINESTRING(30 10, 10 30, 40 40)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  expect(parseSync('LineString(30 10, 10 30, 40 40)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  expect(parseSync('LINESTRING (1 2 3, 4 5 6)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [1, 2, 3],
      [4, 5, 6]
    ]
  });
  expect(parseSync('LINESTRING (1 2 3 4, 5 6 7 8)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [1, 2, 3, 4],
      [5, 6, 7, 8]
    ]
  });
  expect(parseSync('SRID=3857;LINESTRING (30 10, 10 30, 40 40)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  expect(parseSync('POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))', WKTLoader)).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [30, 10],
        [10, 20],
        [20, 40],
        [40, 40],
        [30, 10]
      ]
    ]
  });
  expect(parseSync('POLYGON((30 10, 10 20, 20 40, 40 40, 30 10))', WKTLoader)).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [30, 10],
        [10, 20],
        [20, 40],
        [40, 40],
        [30, 10]
      ]
    ]
  });
  expect(parseSync('SRID=3857;POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))', WKTLoader)).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [30, 10],
        [10, 20],
        [20, 40],
        [40, 40],
        [30, 10]
      ]
    ],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  expect(parseSync(
      'POLYGON ((35 10, 10 20, 15 40, 45 45, 35 10),(20 30, 35 35, 30 20, 20 30))',
      WKTLoader
    )).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [35, 10],
          [10, 20],
          [15, 40],
          [45, 45],
          [35, 10]
        ],
        [
          [20, 30],
          [35, 35],
          [30, 20],
          [20, 30]
        ]
      ]
    });
  expect(parseSync('MULTIPOINT (0 0, 2 3)', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [2, 3]
    ]
  });
  expect(parseSync('MULTIPOINT (1 1, 2 3)', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  expect(parseSync('MultiPoint (1 1, 2 3)', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  expect(parseSync('SRID=3857;MULTIPOINT (1 1, 2 3)', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  expect(parseSync('MULTIPOINT ((0 0), (2 3))', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [2, 3]
    ]
  });
  expect(parseSync('MULTIPOINT ((1 1), (2 3))', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  expect(parseSync('MultiPoint ((1 1), (2 3))', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  expect(parseSync('SRID=3857;MULTIPOINT ((1 1), (2 3))', WKTLoader)).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  expect(parseSync('MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))', WKTLoader)).toEqual({
      type: 'MultiLineString',
      coordinates: [
        [
          [30, 10],
          [10, 30],
          [40, 40]
        ],
        [
          [30, 10],
          [10, 30],
          [40, 40]
        ]
      ]
    });
  expect(parseSync(
      'SRID=3857;MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))',
      WKTLoader
    )).toEqual({
      type: 'MultiLineString',
      coordinates: [
        [
          [30, 10],
          [10, 30],
          [40, 40]
        ],
        [
          [30, 10],
          [10, 30],
          [40, 40]
        ]
      ],
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::3857'
        }
      }
    });
  expect(parseSync(
      'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
      WKTLoader
    )).toEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [30, 20],
            [10, 40],
            [45, 40],
            [30, 20]
          ]
        ],
        [
          [
            [15, 5],
            [40, 10],
            [10, 20],
            [5, 10],
            [15, 5]
          ]
        ]
      ]
    });
  expect(parseSync('MULTIPOLYGON (((-74.03349399999999 40.688348)))', WKTLoader)).toEqual({
    type: 'MultiPolygon',
    coordinates: [[[[-74.03349399999999, 40.688348]]]]
  });
  expect(parseSync(
      'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5), (10 10, 15 10, 15 15, 10 10)))',
      WKTLoader
    )).toEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [30, 20],
            [10, 40],
            [45, 40],
            [30, 20]
          ]
        ],
        [
          [
            [15, 5],
            [40, 10],
            [10, 20],
            [5, 10],
            [15, 5]
          ],
          [
            [10, 10],
            [15, 10],
            [15, 15],
            [10, 10]
          ]
        ]
      ]
    });
  expect(parseSync(
      'SRID=3857;MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
      WKTLoader
    )).toEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [30, 20],
            [10, 40],
            [45, 40],
            [30, 20]
          ]
        ],
        [
          [
            [15, 5],
            [40, 10],
            [10, 20],
            [5, 10],
            [15, 5]
          ]
        ]
      ],
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::3857'
        }
      }
    });
  expect(parseSync(GEOMETRYCOLLECTION_WKT, WKTLoader)).toEqual(GEOMETRYCOLLECTION_GEOJSON);
  expect(parseSync('GeometryCollection(POINT(4 6),LINESTRING(4 6,7 10))', WKTLoader)).toEqual({
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'Point',
        coordinates: [4, 6]
      },
      {
        type: 'LineString',
        coordinates: [
          [4, 6],
          [7, 10]
        ]
      }
    ]
  });
  expect(parseSync('GeometryCollection(POINT(4 6),\nLINESTRING(4 6,7 10))', WKTLoader)).toEqual({
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'Point',
        coordinates: [4, 6]
      },
      {
        type: 'LineString',
        coordinates: [
          [4, 6],
          [7, 10]
        ]
      }
    ]
  });
  expect(parseSync('POINT (1e-6 1E+2)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1e-6, 1e2]
  });
  expect(parseSync('POINT(100)', WKTLoader)).toBe(null);
  expect(parseSync('POINT(100, 100)', WKTLoader)).toBe(null);
  expect(parseSync('POINT()', WKTLoader)).toBe(null);
  expect(parseSync('MULTIPOINT()', WKTLoader)).toBe(null);
  expect(parseSync('MULTIPOINT(1)', WKTLoader)).toBe(null);
  expect(parseSync('MULTIPOINT(1 1, 1)', WKTLoader)).toBe(null);

  expect(parseSync('POINT Z (1 2 3)', WKTLoader)).toEqual({
    type: 'Point',
    coordinates: [1, 2, 3]
  });

  expect(parseSync('LINESTRING Z (30 10 1, 10 30 2, 40 40 3)', WKTLoader)).toEqual({
    type: 'LineString',
    coordinates: [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3]
    ]
  });

  expect(parseSync('POLYGON Z ((30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 5))', WKTLoader)).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [30, 10, 1],
        [10, 20, 2],
        [20, 40, 3],
        [40, 40, 4],
        [30, 10, 5]
      ]
    ]
  });
});

// NOTE(Kyle): Test disabled for now, to be fixed before 2.2.0 release
// test('WKTWorkerLoader', async () => {
//   if (typeof Worker === 'undefined') {
//     t.comment('Worker is not usable in non-browser environments');
//     t.end();
//     return;
//   }

//   const GEOMETRYCOLLECTION_WKT = await load(GEOMETRYCOLLECTION_WKT_URL, WKTWorkerLoader);

//   const response = await fetchFile(GEOMETRYCOLLECTION_GEOJSON_URL);
//   const GEOMETRYCOLLECTION_GEOJSON = await response.json();

//   t.deepEqual(parseSync(GEOMETRYCOLLECTION_WKT, WKTLoader), GEOMETRYCOLLECTION_GEOJSON);
//   t.end();
// });

test('parseWKT#fuzz', () => {
  fuzzer.seed(0);
  const inputs = [
    'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
    'POINT(1.1 1.1)',
    'LINESTRING (30 10, 10 30, 40 40)',
    'GeometryCollection(POINT(4 6),\nLINESTRING(4 6,7 10))'
  ];
  inputs.forEach(function (str) {
    for (let i = 0; i < 10000; i++) {
      const input = fuzzer.mutate.string(str);
      try {
        parseSync(input, WKTLoader);
      } catch (e) {throw new Error(`could not parse ${input}, exception ${e}`)

      }
    }
  });
});
