// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {setLoaderOptions, fetchFile, load, loadInBatches} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';
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
test('ShapefileLoader#loader conformance', () => {
  validateLoader(ShapefileLoader, 'ShapefileLoader');
});
test('ShapefileLoader#load arrow-table fixtures round-trip to GeoJSON', async () => {
  for (const testFileName of TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const table = await load(filename, ShapefileLoader, {shapefile: {shape: 'arrow-table'}});
    const explicitArrowTable = await load(filename, ShapefileLoader, {
      shapefile: {shape: 'arrow-table'}
    });
    const geoMetadata = getGeoMetadata(table.schema.metadata);
    expect(geoMetadata?.primary_column, `${testFileName}: geo metadata primary column`).toBe(
      'geometry'
    );
    const rows = getRowsFromArrowTable(table);
    const roundTripped = convertWKBTableToGeoJSON(
      {shape: 'object-row-table', schema: table.schema, data: rows},
      table.schema
    );
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const expected = await response.json();
    expect(getRowsFromArrowTable(table), `${testFileName}: arrow-table output is stable`).toEqual(
      getRowsFromArrowTable(explicitArrowTable)
    );
    expect(roundTripped.features, `${testFileName}: features round-trip`).toEqual(
      expected.features
    );
  }
});
test('ShapefileLoader#load arrow-table reprojects like v3 output', async () => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const arrowTable = await load(filename, ShapefileLoader, {
    shapefile: {shape: 'arrow-table'},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const shapeTable = await load(filename, ShapefileLoader, {
    shapefile: {shape: 'v3'},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const rows = getRowsFromArrowTable(arrowTable);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: rows},
    arrowTable.schema
  );
  expect(roundTripped.features, 'reprojected features match ShapefileLoader').toEqual(
    shapeTable.data
  );
});
test('ShapefileLoader#load arrow-table stores WKB in one contiguous Arrow values buffer', async () => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const table = await load(filename, ShapefileLoader, {shapefile: {shape: 'arrow-table'}});
  const rows = getRowsFromArrowTable(table);
  const recordBatch = table.data.batches[0];
  const geometryFieldIndex = table.schema.fields.findIndex(field => field.name === 'geometry');
  const geometryData = recordBatch.data.children[geometryFieldIndex];
  expect(geometryData.valueOffsets.length, 'geometry offsets cover every row').toBe(
    rows.length + 1
  );
  expect(
    geometryData.valueOffsets[geometryData.valueOffsets.length - 1],
    'last offset points to the end of one values buffer'
  ).toBe(geometryData.values.byteLength);
  expect(
    geometryData.values instanceof Uint8Array,
    'geometry values are stored as a byte buffer'
  ).toBeTruthy();
});
test('ShapefileLoader#load arrow-table can emit typed GeoArrow point geometry', async () => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const table = await load(filename, ShapefileLoader, {
    shapefile: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow'}
  });
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const recordBatch = table.data.batches[0];
  const geometryFieldIndex = table.schema.fields.findIndex(field => field.name === 'geometry');
  const geometryField = table.data.schema.fields[geometryFieldIndex];
  const geometryData = recordBatch.data.children[geometryFieldIndex];
  expect(geoMetadata?.columns.geometry.encoding, 'geo metadata records typed point encoding').toBe(
    'point'
  );
  expect(
    geometryField.metadata.get('ARROW:extension:name'),
    'geometry field has GeoArrow point extension'
  ).toBe('geoarrow.point');
  expect(geometryData.length, 'geometry data has one row per feature').toBe(table.data.numRows);
  expect(geometryData.children[0].values.length, 'coordinates are dense').toBe(
    table.data.numRows * 2
  );
});
test('ShapefileLoader#loadInBatches arrow-table yields stable Arrow schema', async () => {
  for (const testFileName of TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const batches = await loadInBatches(filename, ShapefileLoader, {
      shapefile: {shape: 'arrow-table'},
      metadata: true
    });
    const collectedRows = [];
    let schema = null;
    for await (const batch of batches) {
      if (batch?.batchType === 'metadata') {
        continue;
      }
      schema ||= batch.schema;
      expect(batch.schema, `${testFileName}: batch schema is stable`).toEqual(schema);
      collectedRows.push(...getRowsFromArrowTable(batch));
    }
    const roundTripped = convertWKBTableToGeoJSON(
      {shape: 'object-row-table', schema, data: collectedRows},
      schema
    );
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const expected = await response.json();
    expect(roundTripped.features, `${testFileName}: batched features round-trip`).toEqual(
      expected.features
    );
  }
});
test('ShapefileLoader#loadInBatches arrow-table yields Arrow batches', async () => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const batches = await loadInBatches(filename, ShapefileLoader, {
    shapefile: {shape: 'arrow-table'},
    metadata: true
  });
  let sawDataBatch = false;
  for await (const batch of batches) {
    if (batch?.batchType === 'metadata') {
      continue;
    }
    sawDataBatch = true;
    expect(batch.shape, 'main loader yields arrow-table batches').toBe('arrow-table');
    break;
  }
  expect(sawDataBatch, 'main loader produced at least one Arrow batch').toBeTruthy();
});
test('ShapefileLoader#loadInBatches arrow-table respects batchSize', async () => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const batches = await loadInBatches(filename, ShapefileLoader, {
    shapefile: {shape: 'arrow-table', batchSize: 1}
  });
  const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/points.json`);
  const expected = await response.json();
  let batchCount = 0;
  for await (const batch of batches) {
    if (batch?.batchType === 'metadata' || batch.length === 0) {
      continue;
    }
    batchCount++;
    expect(batch.length, 'emits requested row batch size').toBe(1);
  }
  expect(batchCount, 'emits one Arrow batch per point').toBe(expected.features.length);
});
function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(table.data.get(rowIndex)?.toJSON() || {});
  }
  return rows;
}
