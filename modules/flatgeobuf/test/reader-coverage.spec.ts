// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {FlatGeobufColumnType, FlatGeobufGeometryType} from '../src/lib/flatgeobuf-reader';
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
    expect(schema.fields[1].metadata?.['ARROW:extension:name']).toBe('geoarrow.linestring');
    const geoMetadata = JSON.parse(schema.metadata?.geo || '{}');
    expect(geoMetadata.columns.geometry.geometry_types).toEqual(['LineString Z']);
  });

  test('returns no projection unless requested and handles invalid CRS definitions', () => {
    expect(getProjection({}, false)).toBeUndefined();
    expect(getProjection({crs: {}}, true)).toBeUndefined();
    expect(getProjection({crs: {wkt: 'not a CRS'}}, true)).toBeUndefined();
  });
});
