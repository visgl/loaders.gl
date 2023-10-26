import test from 'tape-promise/tape';

import {tableFromIPC} from 'apache-arrow';
import {GEOARROW_ENCODINGS, parseGeometryFromArrow, getGeometryColumnsFromArrowTable} from '@loaders.gl/arrow';

const POINT_ARROW_FILE = '@loaders.gl/arrow/test/data/point.arrow';
const MULTIPOINT_ARROW_FILE = '@loaders.gl/arrow/test/data/multipoint.arrow';
const LINE_ARROW_FILE = '@loaders.gl/arrow/test/data/line.arrow';
const MULTILINE_ARROW_FILE = '@loaders.gl/arrow/test/data/multiline.arrow';
const POLYGON_ARROW_FILE = '@loaders.gl/arrow/test/data/polygon.arrow';
const MULTIPOLYGON_ARROW_FILE = '@loaders.gl/arrow/test/data/multipolygon.arrow';

// a simple geojson contains one point
const expectedPointGeojson = {
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
const expectedLineStringGeoJson = {
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

// a simple geojson contains one polygon
const expectedPolygonGeojson = {
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
            [1, 1],
            [2, 2],
            [0, 0]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains one MultiPoint
const expectedMultiPointGeoJson = {
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
const expectedMultiLineStringGeoJson = {
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
const expectedMultiPolygonGeojson = {
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

test('ArrowUtils#parseGeometryFromArrow', async t => {
  async function testParseFromArrow(t, arrowFile, expectedGeojson) {
    // TODO: use the following code instead of apache-arrow to load arrow table
    // const arrowTable = await parse(fetchFile(arrowFile), ArrowLoader, {worker: false});
    const response = await fetch(arrowFile);
    const arrayBuffer = await response.arrayBuffer();
    const arrowTable = tableFromIPC(new Uint8Array(arrayBuffer));

    // check if the arrow table is loaded correctly
    t.equal(
      arrowTable.numRows,
      expectedGeojson.features.length,
      `arrow table has ${expectedGeojson.features.length} row`
    );

    const colNames = [...Object.keys(expectedGeojson.features[0].properties), 'geometry'];
    t.equal(arrowTable.numCols, colNames.length, `arrow table has ${colNames.length} columns`);

    // check fields exist in arrow table schema
    arrowTable.schema.fields.map(field =>
      t.equal(colNames.includes(field.name), true, `arrow table has ${field.name} column`)
    );

    const geometryColumns = getGeometryColumnsFromArrowTable(arrowTable);

    // check 'geometry' is in geometryColumns (geometryColumns is a Map object)
    t.equal(Boolean(geometryColumns['geometry']), true, 'geometryColumns has geometry column');

    // get encoding from geometryColumns['geometry']
    const encoding = geometryColumns['geometry'].encoding;

    // check encoding is one of GEOARROW_ENCODINGS
    t.ok(
      Object.values(GEOARROW_ENCODINGS).includes(encoding),
      'encoding is one of GEOARROW_ENCODINGS'
    );

    // get first geometry from arrow geometry column
    const firstArrowGeometry = arrowTable.getChild('geometry')?.get(0);
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

  const testCases = [
    [POINT_ARROW_FILE, expectedPointGeojson],
    [MULTIPOINT_ARROW_FILE, expectedMultiPointGeoJson],
    [LINE_ARROW_FILE, expectedLineStringGeoJson],
    [MULTILINE_ARROW_FILE, expectedMultiLineStringGeoJson],
    [POLYGON_ARROW_FILE, expectedPolygonGeojson],
    [MULTIPOLYGON_ARROW_FILE, expectedMultiPolygonGeojson]
  ];

  testCases.forEach(async testCase => {
    await testParseFromArrow(t, testCase[0], testCase[1]);
  });

  t.end();
});
