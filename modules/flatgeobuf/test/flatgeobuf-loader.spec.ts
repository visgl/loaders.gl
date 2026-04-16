// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {setLoaderOptions, load, loadInBatches} from '@loaders.gl/core';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {getGeoMetadata} from '@loaders.gl/geoarrow';
import {getTableRowAsObject} from '@loaders.gl/schema-utils';

const FLATGEOBUF_COUNTRIES_DATA_URL = '@loaders.gl/flatgeobuf/test/data/countries.fgb';
const FGB_METADATA = {
  metadata: {
    title: '',
    description: '',
    crs: '{"org":"EPSG","code":4326,"name":"WGS 84","description":null,"wkt":"GEOGCRS[\\"WGS 84\\",DATUM[\\"World Geodetic System 1984\\",ELLIPSOID[\\"WGS 84\\",6378137,298.257223563,LENGTHUNIT[\\"metre\\",1]]],PRIMEM[\\"Greenwich\\",0,ANGLEUNIT[\\"degree\\",0.0174532925199433]],CS[ellipsoidal,2],AXIS[\\"latitude\\",north,ORDER[1],ANGLEUNIT[\\"degree\\",0.0174532925199433]],AXIS[\\"longitude\\",east,ORDER[2],ANGLEUNIT[\\"degree\\",0.0174532925199433]],ID[\\"EPSG\\",4326]]","code_string":null}',
    metadata: '',
    geometryType: '6',
    indexNodeSize: '16',
    featureCount: '179',
    bounds: ''
  },
  fields: [
    {
      name: 'id',
      type: 'utf8',
      nullable: true,
      metadata: {
        title: '',
        description: '',
        width: '-1',
        precision: '-1',
        scale: '-1',
        unique: 'false',
        primary_key: 'false'
      }
    },
    {
      name: 'name',
      type: 'utf8',
      nullable: true,
      metadata: {
        title: '',
        description: '',
        width: '-1',
        precision: '-1',
        scale: '-1',
        unique: 'false',
        primary_key: 'false'
      }
    }
  ]
};

setLoaderOptions({
  _workerType: 'test'
});

test('FlatGeobufLoader#loader conformance', t => {
  validateLoader(t, FlatGeobufLoader, 'FlatGeobufLoader');
  t.end();
});

test('FlatGeobufLoader#load', async t => {
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });
  t.equal(geojsonTable.features.length, 179);
  t.equal(geojsonTable.schema.fields.length, 2);
  t.deepEqual(geojsonTable.schema, FGB_METADATA);
  t.end();
});

test('FlatGeobufLoader#load arrow-table round-trips to GeoJSON', async t => {
  const arrowTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    flatgeobuf: {shape: 'arrow-table'}
  });
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });

  t.equal(arrowTable.shape, 'arrow-table', 'returns Arrow table shape');
  t.equal(arrowTable.data.numRows, geojsonTable.features.length, 'preserves row count');
  t.equal(arrowTable.schema.fields.length, 3, 'adds a geometry field');
  t.equal(arrowTable.schema.fields[2].name, 'geometry', 'geometry field appended');
  t.equal(arrowTable.schema.fields[2].type, 'binary', 'geometry field is binary');

  const geoMetadata = getGeoMetadata(arrowTable.schema.metadata);
  t.equal(geoMetadata?.primary_column, 'geometry', 'geo metadata primary column is set');
  t.equal(geoMetadata?.columns.geometry.encoding, 'wkb', 'geo metadata uses WKB encoding');
  t.deepEqual(
    geoMetadata?.columns.geometry.geometry_types,
    ['MultiPolygon'],
    'geo metadata captures FlatGeobuf geometry type'
  );

  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: getRowsFromArrowTable(arrowTable)},
    arrowTable.schema
  );

  t.deepEqual(
    normalizeFeatures(roundTripped.features),
    normalizeFeatures(geojsonTable.features),
    'Arrow output round-trips to GeoJSON'
  );
  t.end();
});

test('FlatGeobufLoader#load arrow-table reprojects like geojson-table', async t => {
  const arrowTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    flatgeobuf: {shape: 'arrow-table'},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });

  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: getRowsFromArrowTable(arrowTable)},
    arrowTable.schema
  );

  t.deepEqual(
    normalizeFeatures(roundTripped.features),
    normalizeFeatures(geojsonTable.features),
    'reprojected Arrow output matches GeoJSON output'
  );
  t.end();
});

test('FlatGeobufLoader#loadInBatches', async t => {
  const iterator = await loadInBatches(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });
  t.ok(iterator);

  const features: any[] = [];
  for await (const feature of iterator) {
    features.push(feature);
  }

  // t.equal(features.length, 179);
  t.ok(features.length);
  t.end();
});

test('FlatGeobufLoader#loadInBatches arrow-table yields stable schema', async t => {
  const iterator = await loadInBatches(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    flatgeobuf: {shape: 'arrow-table'}
  });

  const rows: Record<string, unknown>[] = [];
  let schema = null;

  for await (const batch of iterator) {
    schema ||= batch.schema;
    t.deepEqual(batch.schema, schema, 'batch schema remains stable');
    rows.push(...getRowsFromArrowTable(batch));
  }

  t.ok(schema, 'Arrow batches expose schema');

  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema, data: rows},
    schema
  );
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });

  t.deepEqual(
    normalizeFeatures(roundTripped.features),
    normalizeFeatures(geojsonTable.features),
    'batched Arrow output round-trips to GeoJSON'
  );
  t.end();
});

function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(getTableRowAsObject(table, rowIndex, {}));
  }
  return rows;
}

function normalizeFeatures(features: any[]) {
  return features.map(feature => ({
    ...feature,
    properties: {...(feature.properties || {})}
  }));
}
