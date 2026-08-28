// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {setLoaderOptions, load, loadInBatches} from '@loaders.gl/core';
import {convertGeoArrowToTable, getGeoMetadata} from '@loaders.gl/geoarrow';
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
test('FlatGeobufLoader#loader conformance', () => {
  validateLoader(FlatGeobufLoader, 'FlatGeobufLoader');
});
test('FlatGeobufLoader#load', async () => {
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });
  expect(geojsonTable.features.length).toBe(179);
  expect(geojsonTable.schema.fields.length).toBe(2);
  expect(geojsonTable.schema.fields.map(field => field.name)).toEqual(['id', 'name']);
});
test('FlatGeobufLoader#load arrow-table round-trips to GeoJSON', async () => {
  const arrowTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    flatgeobuf: {shape: 'arrow-table'}
  });
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });
  expect(arrowTable.shape, 'returns Arrow table shape').toBe('arrow-table');
  expect(arrowTable.data.numRows, 'preserves row count').toBe(geojsonTable.features.length);
  expect(arrowTable.schema.fields.length, 'adds a geometry field').toBe(3);
  expect(arrowTable.schema.fields[2].name, 'geometry field appended').toBe('geometry');
  expect(arrowTable.schema.fields[2].type.type, 'geometry field is a nested Arrow list').toBe(
    'list'
  );
  expect(
    arrowTable.schema.fields[2].metadata?.['ARROW:extension:name'],
    'geometry field includes native GeoArrow metadata'
  ).toBe('geoarrow.multipolygon');
  const geoMetadata = getGeoMetadata(arrowTable.schema.metadata);
  expect(geoMetadata?.primary_column, 'geo metadata primary column is set').toBe('geometry');
  expect(geoMetadata?.columns.geometry.encoding, 'geo metadata uses native encoding').toBe(
    'multipolygon'
  );
  expect(
    geoMetadata?.columns.geometry.geometry_types,
    'geo metadata captures FlatGeobuf geometry type'
  ).toEqual(['MultiPolygon']);
  const roundTripped = convertGeoArrowToTable(arrowTable.data, 'geojson-table');
  expect(normalizeFeatures(roundTripped.features), 'Arrow output round-trips to GeoJSON').toEqual(
    normalizeFeatures(geojsonTable.features)
  );
});
test('FlatGeobufLoader#load arrow-table reprojects like geojson-table', async () => {
  const arrowTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    flatgeobuf: {shape: 'arrow-table'},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const roundTripped = convertGeoArrowToTable(arrowTable.data, 'geojson-table');
  expect(
    normalizeFeatures(roundTripped.features),
    'reprojected Arrow output matches GeoJSON output'
  ).toEqual(normalizeFeatures(geojsonTable.features));
});
test('FlatGeobufLoader#loadInBatches', async () => {
  const iterator = await loadInBatches(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });
  expect(iterator).toBeTruthy();
  const features: any[] = [];
  for await (const feature of iterator) {
    features.push(feature);
  }
  expect(features.length).toBeTruthy();
});
test('FlatGeobufLoader#loadInBatches arrow-table yields stable schema', async () => {
  const iterator = await loadInBatches(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false},
    flatgeobuf: {shape: 'arrow-table'}
  });
  let arrowTable = null;
  let schema = null;
  for await (const batch of iterator) {
    schema ||= batch.schema;
    expect(batch.schema, 'batch schema remains stable').toEqual(schema);
    arrowTable = batch;
  }
  expect(schema, 'Arrow batches expose schema').toBeTruthy();
  const roundTripped = convertGeoArrowToTable(arrowTable.data, 'geojson-table');
  const geojsonTable = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    core: {worker: false}
  });
  expect(
    normalizeFeatures(roundTripped.features),
    'batched Arrow output round-trips to GeoJSON'
  ).toEqual(normalizeFeatures(geojsonTable.features));
});
function normalizeFeatures(features: any[]) {
  return features.map(feature => ({
    ...feature,
    geometry: normalizeGeometry(feature.geometry),
    properties: {...(feature.properties || {})}
  }));
}
function normalizeGeometry(geometry: any) {
  if (!geometry) {
    return geometry;
  }
  switch (geometry.type) {
    case 'MultiPoint':
      return geometry.coordinates.length === 1
        ? {type: 'Point', coordinates: geometry.coordinates[0]}
        : geometry;
    case 'MultiLineString':
      return geometry.coordinates.length === 1
        ? {type: 'LineString', coordinates: geometry.coordinates[0]}
        : geometry;
    case 'MultiPolygon':
      return geometry.coordinates.length === 1
        ? {type: 'Polygon', coordinates: geometry.coordinates[0]}
        : geometry;
    default:
      return geometry;
  }
}
