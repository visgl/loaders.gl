// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import test from 'tape-promise/tape';
import parseWKT from '@loaders.gl/wkt/lib/parse-wkt';
import {fetchFile} from '@loaders.gl/core';

const GEOMETRYCOLLECTION_WKT_URL = '@loaders.gl/wkt/test/data/geometrycollection.wkt';
const GEOMETRYCOLLECTION_GEOJSON_URL = '@loaders.gl/wkt/test/data/geometrycollection.geojson';

// eslint-disable-next-line max-statements
test('parseWKT', async (t) => {
  let response = await fetchFile(GEOMETRYCOLLECTION_WKT_URL);
  const GEOMETRYCOLLECTION_WKT = await response.text();

  response = await fetchFile(GEOMETRYCOLLECTION_GEOJSON_URL);
  const GEOMETRYCOLLECTION_GEOJSON = await response.json();

  t.deepEqual(parseWKT('POINT (0 1)'), {
    type: 'Point',
    coordinates: [0, 1]
  });
  t.deepEqual(parseWKT('POINT (1 1)'), {
    type: 'Point',
    coordinates: [1, 1]
  });
  t.deepEqual(parseWKT('POINT(1 1)'), {
    type: 'Point',
    coordinates: [1, 1]
  });
  t.deepEqual(parseWKT('POINT\n\r(1 1)'), {
    type: 'Point',
    coordinates: [1, 1]
  });
  t.deepEqual(parseWKT('POINT(1.1 1.1)'), {
    type: 'Point',
    coordinates: [1.1, 1.1]
  });
  t.deepEqual(parseWKT('point(1.1 1.1)'), {
    type: 'Point',
    coordinates: [1.1, 1.1]
  });
  t.deepEqual(parseWKT('point(1 2 3)'), {
    type: 'Point',
    coordinates: [1, 2, 3]
  });
  t.deepEqual(parseWKT('point(1 2 3 4)'), {
    type: 'Point',
    coordinates: [1, 2, 3, 4]
  });
  t.deepEqual(parseWKT('SRID=3857;POINT (1 2 3)'), {
    type: 'Point',
    coordinates: [1, 2, 3],
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3857'
      }
    }
  });
  t.deepEqual(parseWKT('LINESTRING (30 10, 10 30, 40 40)'), {
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  t.deepEqual(parseWKT('LINESTRING(30 10, 10 30, 40 40)'), {
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  t.deepEqual(parseWKT('LineString(30 10, 10 30, 40 40)'), {
    type: 'LineString',
    coordinates: [
      [30, 10],
      [10, 30],
      [40, 40]
    ]
  });
  t.deepEqual(parseWKT('LINESTRING (1 2 3, 4 5 6)'), {
    type: 'LineString',
    coordinates: [
      [1, 2, 3],
      [4, 5, 6]
    ]
  });
  t.deepEqual(parseWKT('LINESTRING (1 2 3 4, 5 6 7 8)'), {
    type: 'LineString',
    coordinates: [
      [1, 2, 3, 4],
      [5, 6, 7, 8]
    ]
  });
  t.deepEqual(parseWKT('SRID=3857;LINESTRING (30 10, 10 30, 40 40)'), {
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
  t.deepEqual(parseWKT('POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))'), {
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
  t.deepEqual(parseWKT('POLYGON((30 10, 10 20, 20 40, 40 40, 30 10))'), {
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
  t.deepEqual(parseWKT('SRID=3857;POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))'), {
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
    parseWKT('POLYGON ((35 10, 10 20, 15 40, 45 45, 35 10),(20 30, 35 35, 30 20, 20 30))'),
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
  t.deepEqual(parseWKT('MULTIPOINT (0 0, 2 3)'), {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [2, 3]
    ]
  });
  t.deepEqual(parseWKT('MULTIPOINT (1 1, 2 3)'), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseWKT('MultiPoint (1 1, 2 3)'), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseWKT('SRID=3857;MULTIPOINT (1 1, 2 3)'), {
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
  t.deepEqual(parseWKT('MULTIPOINT ((0 0), (2 3))'), {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [2, 3]
    ]
  });
  t.deepEqual(parseWKT('MULTIPOINT ((1 1), (2 3))'), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseWKT('MultiPoint ((1 1), (2 3))'), {
    type: 'MultiPoint',
    coordinates: [
      [1, 1],
      [2, 3]
    ]
  });
  t.deepEqual(parseWKT('SRID=3857;MULTIPOINT ((1 1), (2 3))'), {
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
  t.deepEqual(parseWKT('MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))'), {
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
  t.deepEqual(
    parseWKT('SRID=3857;MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))'),
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
    parseWKT('MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))'),
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
  t.deepEqual(parseWKT('MULTIPOLYGON (((-74.03349399999999 40.688348)))'), {
    type: 'MultiPolygon',
    coordinates: [[[[-74.03349399999999, 40.688348]]]]
  });
  t.deepEqual(
    parseWKT(
      'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5), (10 10, 15 10, 15 15, 10 10)))'
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
    parseWKT(
      'SRID=3857;MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))'
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
  t.deepEqual(parseWKT(GEOMETRYCOLLECTION_WKT), GEOMETRYCOLLECTION_GEOJSON);
  t.deepEqual(parseWKT('GeometryCollection(POINT(4 6),LINESTRING(4 6,7 10))'), {
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
  t.deepEqual(parseWKT('GeometryCollection(POINT(4 6),\nLINESTRING(4 6,7 10))'), {
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
  t.deepEqual(parseWKT('POINT (1e-6 1E+2)'), {
    type: 'Point',
    coordinates: [1e-6, 1e2]
  });
  t.equal(parseWKT('POINT(100)'), null);
  t.equal(parseWKT('POINT(100, 100)'), null);
  t.equal(parseWKT('POINT()'), null);
  t.equal(parseWKT('MULTIPOINT()'), null);
  t.equal(parseWKT('MULTIPOINT(1)'), null);
  t.equal(parseWKT('MULTIPOINT(1 1, 1)'), null);

  t.deepEqual(parseWKT('POINT Z (1 2 3)'), {
    type: 'Point',
    coordinates: [1, 2, 3]
  });

  t.deepEqual(parseWKT('LINESTRING Z (30 10 1, 10 30 2, 40 40 3)'), {
    type: 'LineString',
    coordinates: [
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3]
    ]
  });

  t.deepEqual(parseWKT('POLYGON Z ((30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 5))'), {
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
