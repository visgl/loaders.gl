// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import type {Geometry, Schema} from '@loaders.gl/schema';
import {
  convertWKBToGeometry,
  encodeWKBGeometryValue,
  getGeoMetadata,
  inferGeoParquetGeometryTypes,
  makeWKBGeometryData,
  makeWKBGeometryDataFromWriters,
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

test('geoarrow WKB helpers build Arrow Binary buffers from WKB values', t => {
  const firstPoint = encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]})!;
  const secondPoint = encodeWKBGeometryValue({type: 'Point', coordinates: [3, 4]})!;
  const geometryData = makeWKBGeometryData([firstPoint, null, secondPoint]);

  t.deepEqual(
    [...geometryData.valueOffsets],
    [
      0,
      firstPoint.byteLength,
      firstPoint.byteLength,
      firstPoint.byteLength + secondPoint.byteLength
    ],
    'offsets account for null rows without adding bytes'
  );
  t.deepEqual(
    geometryData.nullBitmap,
    new Uint8Array([0b00000101]),
    'null bitmap marks valid rows'
  );
  t.equal(geometryData.nullCount, 1, 'null count is set');
  t.equal(
    geometryData.values.byteLength,
    firstPoint.byteLength + secondPoint.byteLength,
    'values contain contiguous WKB bytes'
  );
  t.deepEqual(
    convertWKBToGeometry(
      geometryData.values.buffer.slice(
        geometryData.valueOffsets[2],
        geometryData.valueOffsets[3]
      ) as ArrayBuffer
    ),
    {type: 'Point', coordinates: [3, 4]},
    'second non-null geometry decodes from contiguous values'
  );
  t.end();
});

test('geoarrow WKB helpers build Arrow Binary buffers from writer callbacks', t => {
  const geometryData = makeWKBGeometryDataFromWriters([
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    },
    null,
    builder => {
      builder.beginLineString(2);
      builder.writeCoordinate(3, 4);
      builder.writeCoordinate(5, 6);
    }
  ]);

  t.deepEqual([...geometryData.valueOffsets], [0, 21, 21, 62], 'writer offsets are measured');
  t.deepEqual(geometryData.nullBitmap, new Uint8Array([0b00000101]), 'writer null bitmap is set');
  t.equal(geometryData.nullCount, 1, 'writer null count is set');
  t.deepEqual(
    convertWKBToGeometry(
      geometryData.values.buffer.slice(
        geometryData.valueOffsets[2],
        geometryData.valueOffsets[3]
      ) as ArrayBuffer
    ),
    {
      type: 'LineString',
      coordinates: [
        [3, 4],
        [5, 6]
      ]
    },
    'writer output decodes from contiguous values'
  );
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
