// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {
  GEOARROW_TEST_CASES,
  GEOARROW_ENCODINGS
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';

import {load} from '@loaders.gl/core';
import type {FeatureCollection} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {getGeometryColumnsFromSchema, convertGeoArrowGeometryToGeometry} from '@loaders.gl/gis';
import {ArrowLoader} from '@loaders.gl/arrow';

test('ArrowUtils#convertGeoArrowGeometryToGeometry', async (t) => {
  for (const testCase of GEOARROW_TEST_CASES) {
    await testParseFromArrow(t, testCase[0], testCase[1]);
  }
  t.end();
});

async function testParseFromArrow(
  t: Test,
  arrowFile: string,
  expectedGeojson: FeatureCollection
): Promise<void> {
  const arrowTable = await load(arrowFile, ArrowLoader, {
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

    const schema = convertArrowToSchema(table.schema);
    const geometryColumns = getGeometryColumnsFromSchema(schema);

    // check 'geometry' is in geometryColumns (geometryColumns is a Map object)
    t.equal(Boolean(geometryColumns.geometry), true, 'geometryColumns has geometry column');

    // get encoding from geometryColumns['geometry']
    const encoding = geometryColumns.geometry.encoding!;

    // check encoding is one of GEOARROW_ENCODINGS
    t.ok(Object.values(GEOARROW_ENCODINGS).includes(encoding), 'valid GeoArrow encoding');

    // get first geometry from arrow geometry column
    const firstArrowGeometry = table.getChild('geometry')?.get(0);

    // parse arrow geometry to geojson feature
    const firstGeometry = convertGeoArrowGeometryToGeometry(firstArrowGeometry, encoding);

    // check if geometry in firstFeature is equal to the original geometry in expectedPointGeojson
    t.deepEqual(
      firstGeometry,
      expectedGeojson.features[0].geometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    );
  }
}
