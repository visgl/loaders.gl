// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {GEOARROW_TEST_CASES, GEOARROW_ENCODINGS} from '../data/geoarrow/test-cases';

import {fetchFile, parse} from '@loaders.gl/core';
import {FeatureCollection} from '@loaders.gl/schema';
import {ArrowLoader, serializeArrowSchema, parseGeometryFromArrow} from '@loaders.gl/arrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/gis';

test('ArrowUtils#parseGeometryFromArrow', (t) => {
  for (const testCase of GEOARROW_TEST_CASES) {
    testParseFromArrow(t, testCase[0], testCase[1]);
  }
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
    const encoding = geometryColumns.geometry.encoding!;

    // check encoding is one of GEOARROW_ENCODINGS
    t.ok(
      Object.values(GEOARROW_ENCODINGS).includes(encoding),
      'encoding is one of GEOARROW_ENCODINGS'
    );

    // get first geometry from arrow geometry column
    const firstArrowGeometry = table.getChild('geometry')?.get(0);

    // parse arrow geometry to geojson feature
    const firstFeature = parseGeometryFromArrow(firstArrowGeometry, encoding);

    // check if geometry in firstFeature is equal to the original geometry in expectedPointGeojson
    t.deepEqual(
      firstFeature?.geometry,
      expectedGeojson.features[0].geometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    );
  }
}
