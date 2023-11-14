import test, {Test} from 'tape-promise/tape';

import {fetchFile, parse} from '@loaders.gl/core';
import {FeatureCollection} from '@loaders.gl/schema';
import {ArrowLoader, serializeArrowSchema, parseGeometryFromArrow} from '@loaders.gl/arrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/gis';

export const POINT_ARROW_FILE = '@loaders.gl/arrow/test/data/point.arrow';
export const MULTIPOINT_ARROW_FILE = '@loaders.gl/arrow/test/data/multipoint.arrow';
export const LINE_ARROW_FILE = '@loaders.gl/arrow/test/data/line.arrow';
export const MULTILINE_ARROW_FILE = '@loaders.gl/arrow/test/data/multiline.arrow';
export const POLYGON_ARROW_FILE = '@loaders.gl/arrow/test/data/polygon.arrow';
export const MULTIPOLYGON_ARROW_FILE = '@loaders.gl/arrow/test/data/multipolygon.arrow';
export const MULTIPOLYGON_HOLE_ARROW_FILE = '@loaders.gl/arrow/test/data/multipolygon_hole.arrow';

/** Array containing all encodings */
const GEOARROW_ENCODINGS = [
  'geoarrow.multipolygon',
  'geoarrow.polygon',
  'geoarrow.multilinestring',
  'geoarrow.linestring',
  'geoarrow.multipoint',
  'geoarrow.point',
  'geoarrow.wkb',
  'geoarrow.wkt'
];

// a simple geojson contains one point
const expectedPointGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'Point',
        coordinates: [1, 1]
      }
    }
  ]
};

// a simple geojson contains one linestring
const expectedLineStringGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    }
  ]
};

// a simple geojson contains two polygons
const expectedPolygonGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10, 10],
            [10, 11],
            [11, 11],
            [11, 10],
            [10, 10]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains one MultiPoint
const expectedMultiPointGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [1, 1],
          [2, 2]
        ]
      }
    }
  ]
};

// a simple geojson contains one MultiLinestring
const expectedMultiLineStringGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [1, 1],
            [2, 2]
          ],
          [
            [3, 3],
            [4, 4]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains one MultiPolygon
const expectedMultiPolygonGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ]
          ],
          [
            [
              [2, 2],
              [2, 3],
              [3, 3],
              [3, 2],
              [2, 2]
            ]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains two MultiPolygons with a whole in it
const expectedMultiPolygonWithHoleGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ],
            [
              [0.25, 0.25],
              [0.25, 0.75],
              [0.75, 0.75],
              [0.75, 0.25],
              [0.25, 0.25]
            ]
          ],
          [
            [
              [2, 2],
              [2, 3],
              [3, 3],
              [3, 2],
              [2, 2]
            ]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [10, 10],
              [10, 11],
              [11, 11],
              [11, 10],
              [10, 10]
            ],
            [
              [10.25, 10.25],
              [10.25, 10.75],
              [10.75, 10.75],
              [10.75, 10.25],
              [10.25, 10.25]
            ]
          ],
          [
            [
              [12, 12],
              [12, 13],
              [13, 13],
              [13, 12],
              [12, 12]
            ]
          ]
        ]
      }
    }
  ]
};

test('ArrowUtils#parseGeometryFromArrow', (t) => {
  const testCases: [string, FeatureCollection][] = [
    [MULTIPOLYGON_HOLE_ARROW_FILE, expectedMultiPolygonWithHoleGeojson],
    [POINT_ARROW_FILE, expectedPointGeojson],
    [MULTIPOINT_ARROW_FILE, expectedMultiPointGeoJson],
    [LINE_ARROW_FILE, expectedLineStringGeoJson],
    [MULTILINE_ARROW_FILE, expectedMultiLineStringGeoJson],
    [POLYGON_ARROW_FILE, expectedPolygonGeojson],
    [MULTIPOLYGON_ARROW_FILE, expectedMultiPolygonGeojson]
  ];

  testCases.forEach((testCase) => {
    testParseFromArrow(t, testCase[0], testCase[1]);
  });

  t.end();
});

async function testParseFromArrow(
  t: Test,
  arrowFile: string,
  expectedGeojson: FeatureCollection
): Promise<void> {
  const arrowTable = await parse(fetchFile(arrowFile), ArrowLoader, {
    worker: false,
    arrow: {
      shape: 'arrow-table'
    }
  });

  t.equal(arrowTable.shape, 'arrow-table');

  if (arrowTable.shape === 'arrow-table') {
    const table = arrowTable.data;
    // check if the arrow table is loaded correctly
    t.equal(
      table.numRows,
      expectedGeojson.features.length,
      `arrow table has ${expectedGeojson.features.length} row`
    );

    const colNames = [...Object.keys(expectedGeojson.features[0].properties || {}), 'geometry'];
    t.equal(table.numCols, colNames.length, `arrow table has ${colNames.length} columns`);

    // check fields exist in arrow table schema
    table.schema.fields.map((field) =>
      t.equal(colNames.includes(field.name), true, `arrow table has ${field.name} column`)
    );

    const schema = serializeArrowSchema(table.schema);
    const geometryColumns = getGeometryColumnsFromSchema(schema);

    // check 'geometry' is in geometryColumns (geometryColumns is a Map object)
    t.equal(Boolean(geometryColumns.geometry), true, 'geometryColumns has geometry column');

    // get encoding from geometryColumns['geometry']
    const encoding = geometryColumns.geometry.encoding;

    // check encoding is one of GEOARROW_ENCODINGS
    t.ok(
      Object.values(GEOARROW_ENCODINGS).includes(encoding!),
      'encoding is one of GEOARROW_ENCODINGS'
    );

    // get first geometry from arrow geometry column
    const firstArrowGeometry = table.getChild('geometry')?.get(0);
    const firstArrowGeometryObject = {
      encoding,
      data: firstArrowGeometry
    };

    // parse arrow geometry to geojson feature
    const firstFeature = parseGeometryFromArrow(firstArrowGeometryObject);

    // check if geometry in firstFeature is equal to the original geometry in expectedPointGeojson
    t.deepEqual(
      firstFeature?.geometry,
      expectedGeojson.features[0].geometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    );
  }

  return Promise.resolve();
}
