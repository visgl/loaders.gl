// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {describe, expect, test} from 'vitest';
import {convertParquetSchema, ParquetSchema} from '@loaders.gl/parquet';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {decodeSchema} from '../../src/parquetjs/parser/decoders';
import {toPrimitive} from '../../src/parquetjs/schema/types';
import {
  ConvertedType,
  DecimalType,
  EdgeInterpolationAlgorithm,
  FieldRepetitionType,
  Float16Type,
  GeographyType,
  IntType,
  ListType,
  LogicalType,
  NanoSeconds,
  SchemaElement,
  TimeUnit,
  TimestampType,
  Type,
  UUIDType
} from '../../src/parquetjs/parquet-thrift';

const REQUIRED = FieldRepetitionType.REQUIRED;

describe('Parquet 2.13 logical type schema decoding', () => {
  test('prefers LogicalType parameters and emits exact Arrow types', () => {
    const schemaElements = [
      new SchemaElement({name: 'schema', num_children: 6}),
      new SchemaElement({
        name: 'unsigned8',
        type: Type.INT32,
        repetition_type: REQUIRED,
        converted_type: ConvertedType.INT_8,
        logicalType: LogicalType.fromINTEGER(new IntType({bitWidth: 8, isSigned: false}))
      }),
      new SchemaElement({
        name: 'timestampNanos',
        type: Type.INT64,
        repetition_type: REQUIRED,
        field_id: 42,
        logicalType: LogicalType.fromTIMESTAMP(
          new TimestampType({
            isAdjustedToUTC: false,
            unit: TimeUnit.fromNANOS(new NanoSeconds())
          })
        )
      }),
      new SchemaElement({
        name: 'decimal256',
        type: Type.FIXED_LEN_BYTE_ARRAY,
        type_length: 20,
        repetition_type: REQUIRED,
        logicalType: LogicalType.fromDECIMAL(new DecimalType({precision: 40, scale: 9}))
      }),
      new SchemaElement({
        name: 'uuid',
        type: Type.FIXED_LEN_BYTE_ARRAY,
        type_length: 16,
        repetition_type: REQUIRED,
        logicalType: LogicalType.fromUUID(new UUIDType())
      }),
      new SchemaElement({
        name: 'float16',
        type: Type.FIXED_LEN_BYTE_ARRAY,
        type_length: 2,
        repetition_type: REQUIRED,
        logicalType: LogicalType.fromFLOAT16(new Float16Type())
      }),
      new SchemaElement({
        name: 'geography',
        type: Type.BYTE_ARRAY,
        repetition_type: REQUIRED,
        logicalType: LogicalType.fromGEOGRAPHY(
          new GeographyType({crs: 'EPSG:4326', algorithm: EdgeInterpolationAlgorithm.KARNEY})
        )
      })
    ];

    const {schema} = decodeSchema(schemaElements, 1, 6);

    expect(schema.unsigned8).toMatchObject({
      type: 'UINT_8',
      physicalType: 'INT32',
      logicalType: {type: 'INTEGER', bitWidth: 8, isSigned: false}
    });
    expect(schema.timestampNanos).toMatchObject({
      type: 'TIMESTAMP_NANOS',
      physicalType: 'INT64',
      logicalType: {type: 'TIMESTAMP', unit: 'NANOS', isAdjustedToUTC: false},
      fieldId: 42
    });
    expect(schema.decimal256).toMatchObject({
      type: 'DECIMAL_FIXED_LEN_BYTE_ARRAY',
      precision: 40,
      scale: 9
    });
    expect(schema.geography.logicalType).toEqual({
      type: 'GEOGRAPHY',
      crs: 'EPSG:4326',
      algorithm: 'KARNEY'
    });

    const serializedSchema = convertParquetSchema(new ParquetSchema(schema), null);
    expect(serializedSchema.fields.map(field => field.type)).toEqual([
      'uint8',
      'timestamp-nanosecond',
      {type: 'decimal', bitWidth: 256, precision: 40, scale: 9},
      {type: 'fixed-size-binary', byteWidth: 16},
      'float16',
      'binary'
    ]);
    expect(serializedSchema.fields[1].metadata).toMatchObject({fieldId: '42'});
  });

  test('encodes high-precision decimals as sign-extended two\'s-complement bytes', () => {
    const field = new ParquetSchema({
      decimal: {
        type: 'DECIMAL_FIXED_LEN_BYTE_ARRAY',
        typeLength: 17,
        precision: 40,
        scale: 0
      }
    }).fields.decimal;
    const magnitude = 1_234_567_890_123_456_789_012_345_678_901_234_567_890n;

    expect(bytesToHex(toPrimitive(field.originalType!, magnitude, field) as Uint8Array)).toBe(
      '03a0c92075c0dbf3b8acbc5f96ce3f0ad2'
    );
    expect(bytesToHex(toPrimitive(field.originalType!, -magnitude, field) as Uint8Array)).toBe(
      'fc5f36df8a3f240c475343a06931c0f52e'
    );
  });

  test('preserves logical annotations on nested group fields', () => {
    const schemaElements = [
      new SchemaElement({name: 'schema', num_children: 1}),
      new SchemaElement({
        name: 'items',
        num_children: 1,
        repetition_type: REQUIRED,
        logicalType: LogicalType.fromLIST(new ListType()),
        field_id: 7
      }),
      new SchemaElement({name: 'value', type: Type.INT32, repetition_type: REQUIRED})
    ];

    const {schema} = decodeSchema(schemaElements, 1, 1);
    const parquetSchema = new ParquetSchema(schema);
    const serializedSchema = convertParquetSchema(parquetSchema, null);

    expect(schema.items).toMatchObject({logicalType: {type: 'LIST'}, fieldId: 7});
    expect(parquetSchema.fields.items).toMatchObject({logicalType: {type: 'LIST'}, fieldId: 7});
    expect(serializedSchema.fields[0].type).toMatchObject({type: 'struct'});
    expect(serializedSchema.fields[0].metadata).toMatchObject({fieldId: '7'});
  });

  test('hydrates Arrow classes for modern logical types', () => {
    const schema = new ParquetSchema({
      date: {type: 'DATE'},
      timeNanos: {type: 'TIME_NANOS'},
      timestampMicros: {type: 'TIMESTAMP_MICROS'},
      enumValue: {type: 'ENUM'},
      float16: {type: 'FLOAT16'}
    });
    const serializedSchema = convertParquetSchema(schema, null);

    expect(serializedSchema.fields.map(field => field.type)).toEqual([
      'date-day',
      'time-nanosecond',
      'timestamp-microsecond',
      'utf8',
      'float16'
    ]);
    const arrowSchema = convertSchemaToArrow(serializedSchema);
    expect(arrowSchema.fields.map(field => field.type.constructor)).toEqual([
      arrow.DateDay,
      arrow.TimeNanosecond,
      arrow.TimestampMicrosecond,
      arrow.Utf8,
      arrow.Float16
    ]);
  });
});

/** Formats bytes as a lowercase hexadecimal string for exact representation assertions. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
