// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  GEOARROW_TEST_CASES,
  GEOARROW_ENCODINGS
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import {load} from '@loaders.gl/core';
import type {FeatureCollection} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {getGeometryColumnsFromSchema, convertGeoArrowGeometryToGeoJSON} from '@loaders.gl/geoarrow';
import {ArrowLoader} from '@loaders.gl/arrow';
test('ArrowUtils#convertGeoArrowGeometryToGeoJSON', async () => {
  for (const testCase of GEOARROW_TEST_CASES) {
    await testParseFromArrow(testCase[0], testCase[1]);
  }
});
async function testParseFromArrow(
  arrowFile: string,
  expectedGeojson: FeatureCollection
): Promise<void> {
  const arrowTable = await load(arrowFile, ArrowLoader, {
    core: {worker: false},
    arrow: {shape: 'arrow-table'}
  });
  expect(arrowTable.shape).toBe('arrow-table');
  if (arrowTable.shape === 'arrow-table') {
    const table = arrowTable.data;
    // check if the arrow table is loaded correctly
    expect(table.numRows, `arrow table has ${expectedGeojson.features.length} row`).toBe(
      expectedGeojson.features.length
    );
    const colNames = [...Object.keys(expectedGeojson.features[0].properties || {}), 'geometry'];
    expect(table.numCols, `arrow table has ${colNames.length} columns`).toBe(colNames.length);
    // check fields exist in arrow table schema
    table.schema.fields.map(field =>
      expect(colNames.includes(field.name), `arrow table has ${field.name} column`).toBe(true)
    );
    const schema = convertArrowToSchema(table.schema);
    const geometryColumns = getGeometryColumnsFromSchema(schema);
    // check 'geometry' is in geometryColumns (geometryColumns is a Map object)
    expect(Boolean(geometryColumns.geometry), 'geometryColumns has geometry column').toBe(true);
    // get encoding from geometryColumns['geometry']
    const encoding = geometryColumns.geometry.encoding!;
    // check encoding is one of GEOARROW_ENCODINGS
    expect(
      Object.values(GEOARROW_ENCODINGS).includes(encoding),
      'valid GeoArrow encoding'
    ).toBeTruthy();
    // get first geometry from arrow geometry column
    const firstArrowGeometry = table.getChild('geometry')?.get(0);
    // parse arrow geometry to geojson feature
    const firstGeometry = convertGeoArrowGeometryToGeoJSON(firstArrowGeometry, encoding);
    // check if geometry in firstFeature is equal to the original geometry in expectedPointGeojson
    expect(
      firstGeometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    ).toEqual(expectedGeojson.features[0].geometry);
  }
}
