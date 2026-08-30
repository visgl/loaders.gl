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
  BsonType,
  DateType,
  DecimalType,
  EdgeInterpolationAlgorithm,
  EnumType,
  FieldRepetitionType,
  Float16Type,
  GeographyType,
  GeometryType,
  IntType,
  JsonType,
  ListType,
  LogicalType,
  MapType,
  MicroSeconds,
  NanoSeconds,
  NullType,
  SchemaElement,
  StringType,
  TimeType,
  TimeUnit,
  TimestampType,
  Type,
  UUIDType,
  VariantType
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

  test('decodes the complete modern logical-type union', () => {
    const logicalTypes = [
      LogicalType.fromSTRING(new StringType()),
      LogicalType.fromMAP(new MapType()),
      LogicalType.fromLIST(new ListType()),
      LogicalType.fromENUM(new EnumType()),
      LogicalType.fromDATE(new DateType()),
      LogicalType.fromTIME(
        new TimeType({isAdjustedToUTC: true, unit: TimeUnit.fromMICROS(new MicroSeconds())})
      ),
      LogicalType.fromUNKNOWN(new NullType()),
      LogicalType.fromJSON(new JsonType()),
      LogicalType.fromBSON(new BsonType()),
      LogicalType.fromUUID(new UUIDType()),
      LogicalType.fromFLOAT16(new Float16Type()),
      LogicalType.fromVARIANT(new VariantType({specification_version: 2})),
      LogicalType.fromGEOMETRY(new GeometryType({crs: 'OGC:CRS84'})),
      LogicalType.fromGEOGRAPHY(new GeographyType({crs: 'OGC:CRS84'}))
    ];
    const expectedTypes = [
      'UTF8',
      'BYTE_ARRAY',
      'BYTE_ARRAY',
      'ENUM',
      'DATE',
      'TIME_MICROS',
      'UNKNOWN',
      'JSON',
      'BSON',
      'UUID',
      'FLOAT16',
      'VARIANT',
      'GEOMETRY',
      'GEOGRAPHY'
    ];
    const elements = logicalTypes.map(
      (logicalType, index) =>
        new SchemaElement({
          name: `field${index}`,
          type: Type.BYTE_ARRAY,
          repetition_type:
            index === 0
              ? FieldRepetitionType.OPTIONAL
              : index === 1
                ? FieldRepetitionType.REPEATED
                : REQUIRED,
          logicalType
        })
    );

    const {schema} = decodeSchema(
      [new SchemaElement({name: 'schema', num_children: elements.length}), ...elements],
      1,
      elements.length
    );
    expect(Object.values(schema).map(field => field.type)).toEqual(expectedTypes);
    expect(schema.field0.optional).toBe(true);
    expect(schema.field1.repeated).toBe(true);
    expect(schema.field11.logicalType).toEqual({type: 'VARIANT', specificationVersion: 2});
    expect(schema.field12.logicalType).toEqual({type: 'GEOMETRY', crs: 'OGC:CRS84'});
    expect(schema.field13.logicalType).toEqual({
      type: 'GEOGRAPHY',
      crs: 'OGC:CRS84',
      algorithm: undefined
    });
  });

  test('decodes every legacy converted-type annotation', () => {
    const convertedTypes = [
      ConvertedType.UTF8,
      ConvertedType.MAP,
      ConvertedType.MAP_KEY_VALUE,
      ConvertedType.LIST,
      ConvertedType.ENUM,
      ConvertedType.DECIMAL,
      ConvertedType.DATE,
      ConvertedType.TIME_MILLIS,
      ConvertedType.TIME_MICROS,
      ConvertedType.TIMESTAMP_MILLIS,
      ConvertedType.TIMESTAMP_MICROS,
      ConvertedType.UINT_8,
      ConvertedType.UINT_16,
      ConvertedType.UINT_32,
      ConvertedType.UINT_64,
      ConvertedType.INT_8,
      ConvertedType.INT_16,
      ConvertedType.INT_32,
      ConvertedType.INT_64,
      ConvertedType.JSON,
      ConvertedType.BSON
    ];
    const elements = convertedTypes.map(
      (convertedType, index) =>
        new SchemaElement({
          name: `legacy${index}`,
          type: index === 5 ? Type.FIXED_LEN_BYTE_ARRAY : Type.BYTE_ARRAY,
          type_length: index === 5 ? 8 : undefined,
          repetition_type: REQUIRED,
          converted_type: convertedType,
          precision: 12,
          scale: 2
        })
    );

    const {schema} = decodeSchema(
      [new SchemaElement({name: 'schema', num_children: elements.length}), ...elements],
      1,
      elements.length
    );
    expect(Object.values(schema).map(field => field.logicalType?.type)).toEqual([
      'STRING',
      'MAP',
      'MAP',
      'LIST',
      'ENUM',
      'DECIMAL',
      'DATE',
      'TIME',
      'TIME',
      'TIMESTAMP',
      'TIMESTAMP',
      'INTEGER',
      'INTEGER',
      'INTEGER',
      'INTEGER',
      'INTEGER',
      'INTEGER',
      'INTEGER',
      'INTEGER',
      'JSON',
      'BSON'
    ]);
    expect(schema.legacy5).toMatchObject({type: 'DECIMAL_FIXED_LEN_BYTE_ARRAY', precision: 12, scale: 2});
    expect(schema.legacy11.logicalType).toEqual({type: 'INTEGER', bitWidth: 8, isSigned: false});
    expect(schema.legacy18.logicalType).toEqual({type: 'INTEGER', bitWidth: 64, isSigned: true});
  });

  test('rejects malformed logical schema annotations', () => {
    expect(() =>
      decodeSchema(
        [
          new SchemaElement({name: 'schema', num_children: 1}),
          new SchemaElement({
            name: 'invalid',
            type: Type.INT32,
            repetition_type: 99 as FieldRepetitionType
          })
        ],
        1,
        1
      )
    ).toThrow('Invalid ENUM value');
    expect(() =>
      decodeSchema(
        [
          new SchemaElement({name: 'schema', num_children: 1}),
          new SchemaElement({
            name: 'invalid',
            type: Type.INT32,
            repetition_type: REQUIRED,
            logicalType: LogicalType.fromINTEGER(new IntType({bitWidth: 24, isSigned: true}))
          })
        ],
        1,
        1
      )
    ).toThrow('invalid INTEGER bit width');
    expect(() =>
      decodeSchema(
        [
          new SchemaElement({name: 'schema', num_children: 1}),
          new SchemaElement({
            name: 'invalid',
            type: Type.INT64,
            repetition_type: REQUIRED,
            logicalType: LogicalType.fromTIME(
              new TimeType({isAdjustedToUTC: false, unit: new TimeUnit({})})
            )
          })
        ],
        1,
        1
      )
    ).toThrow('Cannot read a TUnion with no set value');
  });
});

/** Formats bytes as a lowercase hexadecimal string for exact representation assertions. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
