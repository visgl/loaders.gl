// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('ShapefileLoader#loader conformance', t => {
  validateLoader(t, ShapefileLoader, 'ShapefileLoader');
  t.end();
});

test('ShapefileLoader#load arrow-table fixtures round-trip to GeoJSON', async t => {
  for (const testFileName of TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const table = await load(filename, ShapefileLoader, {shapefile: {shape: 'arrow-table'}});
    const explicitArrowTable = await load(filename, ShapefileLoader, {
      shapefile: {shape: 'arrow-table'}
    });
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
    t.deepEqual(
      getRowsFromArrowTable(table),
      getRowsFromArrowTable(explicitArrowTable),
      `${testFileName}: arrow-table output is stable`
    );
    t.deepEqual(roundTripped.features, expected.features, `${testFileName}: features round-trip`);
  }

  t.end();
});

test('ShapefileLoader#load arrow-table reprojects like v3 output', async t => {
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

  t.deepEqual(roundTripped.features, shapeTable.data, 'reprojected features match ShapefileLoader');
  t.end();
});

test('ShapefileLoader#load arrow-table stores WKB in one contiguous Arrow values buffer', async t => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const table = await load(filename, ShapefileLoader, {shapefile: {shape: 'arrow-table'}});
  const rows = getRowsFromArrowTable(table);
  const recordBatch = table.data.batches[0];
  const geometryFieldIndex = table.schema.fields.findIndex(field => field.name === 'geometry');
  const geometryData = recordBatch.data.children[geometryFieldIndex];

  t.equal(geometryData.valueOffsets.length, rows.length + 1, 'geometry offsets cover every row');
  t.equal(
    geometryData.valueOffsets[geometryData.valueOffsets.length - 1],
    geometryData.values.byteLength,
    'last offset points to the end of one values buffer'
  );
  t.ok(geometryData.values instanceof Uint8Array, 'geometry values are stored as a byte buffer');
  t.end();
});

test('ShapefileLoader#loadInBatches arrow-table yields stable Arrow schema', async t => {
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

test('ShapefileLoader#loadInBatches arrow-table yields Arrow batches', async t => {
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
    t.equal(batch.shape, 'arrow-table', 'main loader yields arrow-table batches');
    break;
  }

  t.ok(sawDataBatch, 'main loader produced at least one Arrow batch');
  t.end();
});

test('ShapefileLoader#loadInBatches arrow-table respects batchSize', async t => {
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
    t.equal(batch.length, 1, 'emits requested row batch size');
  }

  t.equal(batchCount, expected.features.length, 'emits one Arrow batch per point');
  t.end();
});

function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(table.data.get(rowIndex)?.toJSON() || {});
  }
  return rows;
}
