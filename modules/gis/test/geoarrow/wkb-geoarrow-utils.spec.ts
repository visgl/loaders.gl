// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import type {Geometry, Schema} from '@loaders.gl/schema';
import {
  encodeWKBGeometryValue,
  getGeoMetadata,
  inferGeoParquetGeometryTypes,
  makeWKBGeometryField,
  setGeoMetadata,
  setWKBGeometrySchemaMetadata,
  unpackGeoMetadata,
  unpackJSONStringMetadata
} from '@loaders.gl/gis';

test('geoarrow WKB helpers round-trip metadata for object and Map containers', t => {
  const geoMetadata = {
    version: '1.1.0',
    primary_column: 'geometry',
    columns: {
      geometry: {
        encoding: 'wkb' as const,
        geometry_types: ['Point' as const]
      }
    }
  };

  const objectMetadata: Record<string, string> = {};
  setGeoMetadata(objectMetadata, geoMetadata);
  t.deepEqual(getGeoMetadata(objectMetadata), geoMetadata, 'round-trips object metadata');

  const mapMetadata = new Map<string, string>();
  setGeoMetadata(mapMetadata, geoMetadata);
  t.deepEqual(getGeoMetadata(mapMetadata), geoMetadata, 'round-trips map metadata');
  unpackGeoMetadata(mapMetadata);
  t.equal(mapMetadata.get('geo.version'), '1.1.0', 'unpacks geo metadata');

  objectMetadata.pandas = JSON.stringify({index_columns: ['id']});
  unpackJSONStringMetadata(objectMetadata, 'pandas');
  t.equal(objectMetadata['pandas.index_columns'], '["id"]', 'unpacks arbitrary JSON metadata keys');
  t.end();
});

test('geoarrow WKB helpers update schema metadata and infer geometry types', t => {
  const geometryField = makeWKBGeometryField('geometry');
  const schema: Schema = {
    fields: [geometryField],
    metadata: {}
  };

  setWKBGeometrySchemaMetadata(schema, {
    geometryColumnName: 'geometry',
    geometryTypes: inferGeoParquetGeometryTypes([
      {type: 'Point', coordinates: [0, 1]},
      {
        type: 'LineString',
        coordinates: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      }
    ] as Geometry[])
  });

  t.deepEqual(
    getGeoMetadata(schema.metadata),
    {
      version: '1.1.0',
      primary_column: 'geometry',
      columns: {
        geometry: {
          encoding: 'wkb',
          geometry_types: ['Point', 'LineString Z']
        }
      }
    },
    'adds WKB geo metadata to schema'
  );
  t.equal(
    geometryField.metadata?.['ARROW:extension:name'],
    'geoarrow.wkb',
    'adds GeoArrow field metadata for WKB geometry columns'
  );
  t.end();
});

test('geoarrow WKB helpers encode Geometry and pass through byte values', t => {
  const geometryBytes = encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]});
  t.ok(geometryBytes instanceof Uint8Array, 'encodes GeoJSON geometry to bytes');

  const inputBytes = new Uint8Array([1, 2, 3, 4]);
  const outputBytes = encodeWKBGeometryValue(inputBytes);
  t.deepEqual([...outputBytes!], [1, 2, 3, 4], 'passes through typed array bytes');
  t.notEqual(outputBytes, inputBytes, 'returns a copy of passed-through bytes');

  t.throws(
    () => encodeWKBGeometryValue('POINT (1 2)' as unknown as Geometry),
    /Expected a Geometry, ArrayBuffer, ArrayBufferView, or null for WKB encoding/,
    'rejects non-WKB string values'
  );
  t.end();
});
