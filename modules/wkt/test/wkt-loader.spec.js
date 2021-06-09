// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';
import {WKTLoader, WKTWorkerLoader} from '@loaders.gl/wkt';
import {setLoaderOptions, fetchFile, parseSync} from '@loaders.gl/core';

const GEOMETRYCOLLECTION_WKT_URL = '@loaders.gl/wkt/test/data/geometrycollection.wkt';
const GEOMETRYCOLLECTION_GEOJSON_URL = '@loaders.gl/wkt/test/data/geometrycollection.geojson';

setLoaderOptions({
  _workerType: 'test'
});

test('WKTWorkerLoader#loader objects', async (t) => {
  validateLoader(t, WKTLoader, 'WKTLoader');
  validateLoader(t, WKTWorkerLoader, 'WKTWorkerLoader');
  t.end();
});

// eslint-disable-next-line max-statements
test('WKTLoader', async (t) => {
  let response = await fetchFile(GEOMETRYCOLLECTION_WKT_URL);
  const GEOMETRYCOLLECTION_WKT = await response.text();

  response = await fetchFile(GEOMETRYCOLLECTION_GEOJSON_URL);
  const GEOMETRYCOLLECTION_GEOJSON = await response.json();

  t.deepEqual(parseSync('POINT (0 1)', WKTLoader), {
    type: 'Point',
    coordinates: [0, 1]
  });
  t.deepEqual(parseSync('POINT (1 1)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 1]
  });
  t.deepEqual(parseSync('POINT(1 1)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 1]
  });
  t.deepEqual(parseSync('POINT\n\r(1 1)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 1]
  });
  t.deepEqual(parseSync('POINT(1.1 1.1)', WKTLoader), {
    type: 'Point',
    coordinates: [1.1, 1.1]
  });
  t.deepEqual(parseSync('point(1.1 1.1)', WKTLoader), {
    type: 'Point',
    coordinates: [1.1, 1.1]
  });
  t.deepEqual(parseSync('point(1 2 3)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 2, 3]
  });
  t.deepEqual(parseSync('point(1 2 3 4)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 2, 3, 4]
  });
  t.deepEqual(parseSync('SRID=3857;POINT (1 2 3)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 2, 3],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  t.deepEqual(parseSync('LINESTRING (30 10, 10 30, 40 40)', WKTLoader), {
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  t.deepEqual(parseSync('LINESTRING(30 10, 10 30, 40 40)', WKTLoader), {
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  t.deepEqual(parseSync('LineString(30 10, 10 30, 40 40)', WKTLoader), {
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  t.deepEqual(parseSync('LINESTRING (1 2 3, 4 5 6)', WKTLoader), {
    type: 'LineString',
    coordinates: [
      [1, 2, 3],
      [4, 5, 6]
    ]
  });
  t.deepEqual(parseSync('LINESTRING (1 2 3 4, 5 6 7 8)', WKTLoader), {
    type: 'LineString',
    coordinates: [
      [1, 2, 3, 4],
      [5, 6, 7, 8]
    ]
  });
  t.deepEqual(parseSync('SRID=3857;LINESTRING (30 10, 10 30, 40 40)', WKTLoader), {
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
  t.deepEqual(parseSync('POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))', WKTLoader), {
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
  t.deepEqual(parseSync('POLYGON((30 10, 10 20, 20 40, 40 40, 30 10))', WKTLoader), {
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
  t.deepEqual(parseSync('SRID=3857;POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))', WKTLoader), {
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
  t.deepEqual(
    parseSync(
      'POLYGON ((35 10, 10 20, 15 40, 45 45, 35 10),(20 30, 35 35, 30 20, 20 30))',
      WKTLoader
    ),
    {
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
    }
  );
  t.deepEqual(parseSync('MULTIPOINT (0 0, 2 3)', WKTLoader), {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [2, 3]
    ]
  });
  t.deepEqual(parseSync('MULTIPOINT (1 1, 2 3)', WKTLoader), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseSync('MultiPoint (1 1, 2 3)', WKTLoader), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseSync('SRID=3857;MULTIPOINT (1 1, 2 3)', WKTLoader), {
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
  t.deepEqual(parseSync('MULTIPOINT ((0 0), (2 3))', WKTLoader), {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [2, 3]
    ]
  });
  t.deepEqual(parseSync('MULTIPOINT ((1 1), (2 3))', WKTLoader), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseSync('MultiPoint ((1 1), (2 3))', WKTLoader), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseSync('SRID=3857;MULTIPOINT ((1 1), (2 3))', WKTLoader), {
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
  t.deepEqual(
    parseSync('MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))', WKTLoader),
    {
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
    }
  );
  t.deepEqual(
    parseSync(
      'SRID=3857;MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))',
      WKTLoader
    ),
    {
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
    }
  );
  t.deepEqual(
    parseSync(
      'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
      WKTLoader
    ),
    {
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
    }
  );
  t.deepEqual(parseSync('MULTIPOLYGON (((-74.03349399999999 40.688348)))', WKTLoader), {
    type: 'MultiPolygon',
    coordinates: [[[[-74.03349399999999, 40.688348]]]]
  });
  t.deepEqual(
    parseSync(
      'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5), (10 10, 15 10, 15 15, 10 10)))',
      WKTLoader
    ),
    {
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
    }
  );
  t.deepEqual(
    parseSync(
      'SRID=3857;MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
      WKTLoader
    ),
    {
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
    }
  );
  t.deepEqual(parseSync(GEOMETRYCOLLECTION_WKT, WKTLoader), GEOMETRYCOLLECTION_GEOJSON);
  t.deepEqual(parseSync('GeometryCollection(POINT(4 6),LINESTRING(4 6,7 10))', WKTLoader), {
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
  t.deepEqual(parseSync('GeometryCollection(POINT(4 6),\nLINESTRING(4 6,7 10))', WKTLoader), {
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
  t.deepEqual(parseSync('POINT (1e-6 1E+2)', WKTLoader), {
    type: 'Point',
    coordinates: [1e-6, 1e2]
  });
  t.equal(parseSync('POINT(100)', WKTLoader), null);
  t.equal(parseSync('POINT(100, 100)', WKTLoader), null);
  t.equal(parseSync('POINT()', WKTLoader), null);
  t.equal(parseSync('MULTIPOINT()', WKTLoader), null);
  t.equal(parseSync('MULTIPOINT(1)', WKTLoader), null);
  t.equal(parseSync('MULTIPOINT(1 1, 1)', WKTLoader), null);

  t.deepEqual(parseSync('POINT Z (1 2 3)', WKTLoader), {
    type: 'Point',
    coordinates: [1, 2, 3]
  });

  t.deepEqual(parseSync('LINESTRING Z (30 10 1, 10 30 2, 40 40 3)', WKTLoader), {
    type: 'LineString',
    coordinates: [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3]
    ]
  });

  t.deepEqual(parseSync('POLYGON Z ((30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 5))', WKTLoader), {
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

  t.end();
});

// NOTE(Kyle): Test disabled for now, to be fixed before 2.2.0 release
// test('WKTWorkerLoader', async t => {
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
