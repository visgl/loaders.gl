// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';
import {setLoaderOptions, fetchFile, load, loadInBatches} from '@loaders.gl/core';
import {ShapefileArrowLoader, ShapefileLoader} from '@loaders.gl/shapefile';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {getGeoMetadata} from '@loaders.gl/geoarrow';

setLoaderOptions({
  _workerType: 'test',
  worker: false
});

const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const TEST_FILES = [
  'points',
  'polylines',
  'polygons',
  'mixed-properties',
  'utf8-property',
  'empty'
];

test('ShapefileArrowLoader#loader conformance', t => {
  validateLoader(t, ShapefileArrowLoader, 'ShapefileArrowLoader');
  t.end();
});

test('ShapefileArrowLoader#load fixtures round-trip to GeoJSON', async t => {
  for (const testFileName of TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const table = await load(filename, ShapefileArrowLoader);
    const geoMetadata = getGeoMetadata(table.schema.metadata);
    t.equal(
      geoMetadata?.primary_column,
      'geometry',
      `${testFileName}: geo metadata primary column`
    );

    const rows = getRowsFromArrowTable(table);
    const roundTripped = convertWKBTableToGeoJSON(
      {shape: 'object-row-table', schema: table.schema, data: rows},
      table.schema
    );

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const expected = await response.json();
    t.deepEqual(roundTripped.features, expected.features, `${testFileName}: features round-trip`);
  }

  t.end();
});

test('ShapefileArrowLoader#load reprojects like ShapefileLoader', async t => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const arrowTable = await load(filename, ShapefileArrowLoader, {
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const shapeTable = await load(filename, ShapefileLoader, {
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });

  const rows = getRowsFromArrowTable(arrowTable);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: rows},
    arrowTable.schema
  );

  t.deepEqual(roundTripped.features, shapeTable.data, 'reprojected features match ShapefileLoader');
  t.end();
});

test('ShapefileArrowLoader#loadInBatches yields stable Arrow schema', async t => {
  for (const testFileName of TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const batches = await loadInBatches(filename, ShapefileArrowLoader, {metadata: true});
    const collectedRows = [];
    let schema = null;
    for await (const batch of batches) {
      if (batch?.batchType === 'metadata') {
        continue;
      }
      schema ||= batch.schema;
      t.deepEqual(batch.schema, schema, `${testFileName}: batch schema is stable`);
      collectedRows.push(...getRowsFromArrowTable(batch));
    }

    const roundTripped = convertWKBTableToGeoJSON(
      {shape: 'object-row-table', schema, data: collectedRows},
      schema
    );
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const expected = await response.json();
    t.deepEqual(
      roundTripped.features,
      expected.features,
      `${testFileName}: batched features round-trip`
    );
  }

  t.end();
});

function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(table.data.get(rowIndex)?.toJSON() || {});
  }
  return rows;
}
