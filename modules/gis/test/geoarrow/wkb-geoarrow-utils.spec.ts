// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
test('geoarrow WKB helpers round-trip metadata for object and Map containers', () => {
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
  expect(getGeoMetadata(objectMetadata), 'round-trips object metadata').toEqual(geoMetadata);
  const mapMetadata = new Map<string, string>();
  setGeoMetadata(mapMetadata, geoMetadata);
  expect(getGeoMetadata(mapMetadata), 'round-trips map metadata').toEqual(geoMetadata);
  unpackGeoMetadata(mapMetadata);
  expect(mapMetadata.get('geo.version'), 'unpacks geo metadata').toBe('1.1.0');
  objectMetadata.pandas = JSON.stringify({index_columns: ['id']});
  unpackJSONStringMetadata(objectMetadata, 'pandas');
  expect(objectMetadata['pandas.index_columns'], 'unpacks arbitrary JSON metadata keys').toBe(
    '["id"]'
  );
});
test('geoarrow WKB helpers build Arrow Binary buffers from WKB values', () => {
  const firstPoint = encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]})!;
  const secondPoint = encodeWKBGeometryValue({type: 'Point', coordinates: [3, 4]})!;
  const geometryData = makeWKBGeometryData([firstPoint, null, secondPoint]);
  expect(
    [...geometryData.valueOffsets],
    'offsets account for null rows without adding bytes'
  ).toEqual([
    0,
    firstPoint.byteLength,
    firstPoint.byteLength,
    firstPoint.byteLength + secondPoint.byteLength
  ]);
  expect(geometryData.nullBitmap, 'null bitmap marks valid rows').toEqual(
    new Uint8Array([0b00000101])
  );
  expect(geometryData.nullCount, 'null count is set').toBe(1);
  expect(geometryData.values.byteLength, 'values contain contiguous WKB bytes').toBe(
    firstPoint.byteLength + secondPoint.byteLength
  );
  expect(
    convertWKBToGeometry(
      geometryData.values.buffer.slice(
        geometryData.valueOffsets[2],
        geometryData.valueOffsets[3]
      ) as ArrayBuffer
    ),
    'second non-null geometry decodes from contiguous values'
  ).toEqual({type: 'Point', coordinates: [3, 4]});
});
test('geoarrow WKB helpers build Arrow Binary buffers from writer callbacks', () => {
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
  expect([...geometryData.valueOffsets], 'writer offsets are measured').toEqual([0, 21, 21, 62]);
  expect(geometryData.nullBitmap, 'writer null bitmap is set').toEqual(
    new Uint8Array([0b00000101])
  );
  expect(geometryData.nullCount, 'writer null count is set').toBe(1);
  expect(
    convertWKBToGeometry(
      geometryData.values.buffer.slice(
        geometryData.valueOffsets[2],
        geometryData.valueOffsets[3]
      ) as ArrayBuffer
    ),
    'writer output decodes from contiguous values'
  ).toEqual({
    type: 'LineString',
    coordinates: [
      [3, 4],
      [5, 6]
    ]
  });
});
test('geoarrow WKB helpers update schema metadata and infer geometry types', () => {
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
  expect(getGeoMetadata(schema.metadata), 'adds WKB geo metadata to schema').toEqual({
    version: '1.1.0',
    primary_column: 'geometry',
    columns: {
      geometry: {
        encoding: 'wkb',
        geometry_types: ['Point', 'LineString Z']
      }
    }
  });
  expect(
    geometryField.metadata?.['ARROW:extension:name'],
    'adds GeoArrow field metadata for WKB geometry columns'
  ).toBe('geoarrow.wkb');
});
test('geoarrow WKB helpers encode Geometry and pass through byte values', () => {
  const geometryBytes = encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]});
  expect(geometryBytes instanceof Uint8Array, 'encodes GeoJSON geometry to bytes').toBeTruthy();
  const inputBytes = new Uint8Array([1, 2, 3, 4]);
  const outputBytes = encodeWKBGeometryValue(inputBytes);
  expect([...outputBytes!], 'passes through typed array bytes').toEqual([1, 2, 3, 4]);
  expect(outputBytes, 'returns a copy of passed-through bytes').not.toBe(inputBytes);
  expect(
    () => encodeWKBGeometryValue('POINT (1 2)' as unknown as Geometry),
    'rejects non-WKB string values'
  ).toThrow(/Expected a Geometry, ArrayBuffer, ArrayBufferView, or null for WKB encoding/);
});
