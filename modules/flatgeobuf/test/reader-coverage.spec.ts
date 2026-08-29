// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  decodeFlatGeobufGeometry,
  FlatGeobufColumnType,
  FlatGeobufGeometryType,
  getFlatGeobufCRSIdentifier,
  readFlatGeobufHeader
} from '../src/lib/flatgeobuf-reader';
import {getProjection, makeArrowSchema} from '../src/lib/parse-flatgeobuf';

const COLUMN_TYPES = [
  ['byte', FlatGeobufColumnType.Byte, 'int8'],
  ['ubyte', FlatGeobufColumnType.UByte, 'uint8'],
  ['bool', FlatGeobufColumnType.Bool, 'bool'],
  ['short', FlatGeobufColumnType.Short, 'int16'],
  ['ushort', FlatGeobufColumnType.UShort, 'uint16'],
  ['int', FlatGeobufColumnType.Int, 'int32'],
  ['uint', FlatGeobufColumnType.UInt, 'uint32'],
  ['long', FlatGeobufColumnType.Long, 'int64'],
  ['ulong', FlatGeobufColumnType.ULong, 'uint64'],
  ['float', FlatGeobufColumnType.Float, 'float32'],
  ['double', FlatGeobufColumnType.Double, 'float64'],
  ['string', FlatGeobufColumnType.String, 'utf8'],
  ['json', FlatGeobufColumnType.Json, 'utf8'],
  ['datetime', FlatGeobufColumnType.DateTime, 'date-millisecond'],
  ['binary', FlatGeobufColumnType.Binary, 'binary']
] as const;

describe('FlatGeobuf reader metadata branches', () => {
  test.each([
    [new ArrayBuffer(0), 'Invalid or truncated FlatGeobuf buffer'],
    [new Uint8Array([0x66, 0x67, 0x78, 3, 0, 0, 0, 0, 0, 0, 0, 0]).buffer, 'Not a FlatGeobuf file'],
    [
      new Uint8Array([0x66, 0x67, 0x62, 2, 0, 0, 0, 0, 0, 0, 0, 0]).buffer,
      'Unsupported FlatGeobuf version 2'
    ]
  ])('rejects invalid header: %s', (arrayBuffer, message) => {
    expect(() => readFlatGeobufHeader(arrayBuffer)).toThrow(message);
  });

  test('decodes absent geometry as null without touching the buffer', () => {
    expect(
      decodeFlatGeobufGeometry(new ArrayBuffer(0), undefined, {
        geometryType: FlatGeobufGeometryType.Point,
        hasZ: false,
        columns: [],
        featuresCount: 0,
        indexNodeSize: 16,
        headerLength: 0,
        featureOffset: 0
      })
    ).toBeNull();
  });

  test.each(COLUMN_TYPES)('maps %s column type to Arrow', (_name, type, expectedType) => {
    const schema = makeArrowSchema({
      columns: [
        {
          name: 'value',
          type,
          width: -1,
          precision: -1,
          scale: -1,
          nullable: true,
          unique: false,
          primaryKey: false
        }
      ],
      geometryType: FlatGeobufGeometryType.Point,
      hasZ: false,
      indexNodeSize: 16,
      featuresCount: 0
    });

    expect(schema.fields[0].type).toBe(expectedType);
  });

  test('uses null for unknown column types and preserves Z metadata', () => {
    const schema = makeArrowSchema({
      columns: [
        {
          name: 'unknown',
          type: 99,
          width: 10,
          precision: 2,
          scale: 1,
          nullable: false,
          unique: true,
          primaryKey: true
        }
      ],
      geometryType: FlatGeobufGeometryType.LineString,
      hasZ: true,
      indexNodeSize: 4,
      featuresCount: 12,
      envelope: new Float64Array([1, 2, 3, 4]),
      title: 'title',
      description: 'description',
      metadata: 'metadata'
    });

    expect(schema.fields[0].type).toBe('null');
    expect(schema.fields[0].metadata).toMatchObject({
      width: '10',
      precision: '2',
      scale: '1',
      unique: 'true',
      primary_key: 'true'
    });
    expect(schema.metadata).toMatchObject({
      title: 'title',
      description: 'description',
      featureCount: '12',
      bounds: '1,2,3,4'
    });
    expect(schema.fields[1].metadata?.['ARROW:extension:name']).toBe('geoarrow.wkb');
  });

  test('creates projections only from declared source CRS definitions', () => {
    expect(getProjection({}, false)).toBeUndefined();
    expect(() => getProjection({crs: {}}, true)).toThrow(
      'FlatGeobuf reprojection requires a source CRS in the file header'
    );
    expect(() => getProjection({crs: {wkt: 'not a CRS'}}, true)).toThrow(
      'FlatGeobuf reprojection failed'
    );
    expect(getProjection({crs: {codeString: 'EPSG:4326'}}, true)).toBeDefined();
    expect(getProjection({crs: {org: 'EPSG', code: 4326}}, true)).toBeDefined();
    expect(() => getProjection({crs: {code: 4326}}, true)).toThrow(
      'FlatGeobuf reprojection requires a source CRS in the file header'
    );
  });

  test('preserves the authority for numeric CRS codes', () => {
    expect(getFlatGeobufCRSIdentifier({org: 'ESRI', code: 102100})).toBe('ESRI:102100');
    expect(getFlatGeobufCRSIdentifier({org: 'CUSTOM', code: 4326})).toBe('CUSTOM:4326');
    expect(getFlatGeobufCRSIdentifier({code: 4326})).toBeUndefined();
  });
});
