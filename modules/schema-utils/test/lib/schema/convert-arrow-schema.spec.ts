// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import type {DataType, KeyType} from '@loaders.gl/schema';
import {
  ArrowTableBuilder,
  convertArrowToSchema,
  convertSchemaToArrow,
  deserializeArrowType,
  serializeArrowType,
  getArrowViewTypeSupport
} from '@loaders.gl/schema-utils';

const PRIMITIVE_ARROW_TYPES: [string, arrow.DataType, DataType][] = [
  ['Null', new arrow.Null(), 'null'],
  ['Binary', new arrow.Binary(), 'binary'],
  ['Bool', new arrow.Bool(), 'bool'],
  ['Int8', new arrow.Int8(), 'int8'],
  ['Int16', new arrow.Int16(), 'int16'],
  ['Int32', new arrow.Int32(), 'int32'],
  ['Int64', new arrow.Int64(), 'int64'],
  ['Uint8', new arrow.Uint8(), 'uint8'],
  ['Uint16', new arrow.Uint16(), 'uint16'],
  ['Uint32', new arrow.Uint32(), 'uint32'],
  ['Uint64', new arrow.Uint64(), 'uint64'],
  ['Float16', new arrow.Float16(), 'float16'],
  ['Float32', new arrow.Float32(), 'float32'],
  ['Float64', new arrow.Float64(), 'float64'],
  ['Utf8', new arrow.Utf8(), 'utf8'],
  ['DateDay', new arrow.DateDay(), 'date-day'],
  ['DateMillisecond', new arrow.DateMillisecond(), 'date-millisecond'],
  ['TimeSecond', new arrow.TimeSecond(), 'time-second'],
  ['TimeMillisecond', new arrow.TimeMillisecond(), 'time-millisecond'],
  ['TimeMicrosecond', new arrow.TimeMicrosecond(), 'time-microsecond'],
  ['TimeNanosecond', new arrow.TimeNanosecond(), 'time-nanosecond'],
  ['TimestampSecond', new arrow.TimestampSecond(), 'timestamp-second'],
  ['TimestampMillisecond', new arrow.TimestampMillisecond(), 'timestamp-millisecond'],
  ['TimestampMicrosecond', new arrow.TimestampMicrosecond(), 'timestamp-microsecond'],
  ['TimestampNanosecond', new arrow.TimestampNanosecond(), 'timestamp-nanosecond'],
  ['IntervalDayTime', new arrow.IntervalDayTime(), 'interval-daytime'],
  ['IntervalYearMonth', new arrow.IntervalYearMonth(), 'interval-yearmonth']
];

test('convert-arrow-schema#FixedSizeBinary round-trip', () => {
  const arrowSchema = new arrow.Schema([
    new arrow.Field('uuid', new arrow.FixedSizeBinary(16), false)
  ]);

  const schema = convertArrowToSchema(arrowSchema);
  expect(schema.fields[0].type, 'serializes FixedSizeBinary').toEqual({
    type: 'fixed-size-binary',
    byteWidth: 16
  });

  const roundTripSchema = convertSchemaToArrow(schema);
  const roundTripField = roundTripSchema.fields[0];
  expect(
    roundTripField.type instanceof arrow.FixedSizeBinary,
    'deserializes FixedSizeBinary'
  ).toBeTruthy();
  expect((roundTripField.type as arrow.FixedSizeBinary).byteWidth, 'preserves byte width').toBe(16);
});

test('convert-arrow-schema#view types are opt-in', () => {
  const schema = {
    fields: [
      {name: 'text', type: 'utf8' as const, nullable: true},
      {name: 'bytes', type: 'binary' as const, nullable: true}
    ],
    metadata: {}
  };

  const defaultArrowSchema = convertSchemaToArrow(schema);
  expect(
    defaultArrowSchema.fields[0].type instanceof arrow.Utf8,
    'uses Utf8 by default'
  ).toBeTruthy();
  expect(
    defaultArrowSchema.fields[1].type instanceof arrow.Binary,
    'uses Binary by default'
  ).toBeTruthy();

  const support = getArrowViewTypeSupport();
  expect(support.utf8View, 'detects Utf8View support').toBeTruthy();
  expect(support.binaryView, 'detects BinaryView support').toBeTruthy();

  const viewArrowSchema = convertSchemaToArrow(schema, {viewTypes: 'prefer'});
  expect(viewArrowSchema.fields[0].type.constructor.name, 'prefers Utf8View').toBe('Utf8View');
  expect(viewArrowSchema.fields[1].type.constructor.name, 'prefers BinaryView').toBe('BinaryView');
  expect(
    convertArrowToSchema(viewArrowSchema).fields.map(field => field.type),
    'serializes view types'
  ).toEqual(['utf8-view', 'binary-view']);
});

test('ArrowTableBuilder#view types round-trip through IPC', () => {
  const builder = new ArrowTableBuilder(
    {
      fields: [
        {name: 'text', type: 'utf8', nullable: true},
        {name: 'bytes', type: 'binary', nullable: true}
      ],
      metadata: {}
    },
    {viewTypes: 'require'}
  );

  builder.addObjectRow({text: 'short', bytes: new Uint8Array([1, 2, 3])});
  builder.addObjectRow({
    text: 'a string longer than twelve bytes',
    bytes: new Uint8Array([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  });

  const table = builder.finishTable();
  const roundTripTable = arrow.tableFromIPC(arrow.tableToIPC(table.data));
  expect(
    table.schema.fields.map(field => field.type),
    'reports the effective view schema'
  ).toEqual(['utf8-view', 'binary-view']);
  expect(roundTripTable.schema.fields[0].type.constructor.name).toBe('Utf8View');
  expect(roundTripTable.schema.fields[1].type.constructor.name).toBe('BinaryView');
  expect(roundTripTable.getChild('text')?.get(0)).toBe('short');
  expect(Array.from(roundTripTable.getChild('bytes')?.get(1) || [])).toEqual([
    4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
  ]);
});

test('ArrowTableBuilder#finishBatch preserves rows in a zero-column projection', () => {
  const builder = new ArrowTableBuilder({fields: [], metadata: {}});
  builder.addArrayRow([]);
  builder.addArrayRow([]);

  const batch = builder.finishBatch();

  expect(batch?.length).toBe(2);
  expect(batch?.data.numRows).toBe(2);
  expect(batch?.data.numCols).toBe(0);
});

test.each(
  PRIMITIVE_ARROW_TYPES
)('%s type round-trips through serialized schema', (_, type, dataType) => {
  expect(serializeArrowType(type)).toEqual(dataType);
  expect(serializeArrowType(deserializeArrowType(dataType))).toEqual(dataType);
});

test('generic Arrow type classes serialize every unit branch', () => {
  expect(serializeArrowType(new arrow.Int(true, 32))).toBe('int32');
  expect(serializeArrowType(new arrow.Int(false, 16))).toBe('uint16');
  expect(serializeArrowType(new arrow.Float(arrow.Precision.HALF))).toBe('float16');
  expect(serializeArrowType(new arrow.Float(arrow.Precision.SINGLE))).toBe('float32');
  expect(serializeArrowType(new arrow.Float(arrow.Precision.DOUBLE))).toBe('float64');
  expect(serializeArrowType(new arrow.Float(99 as arrow.Precision))).toBe('float16');
  expect(serializeArrowType(new arrow.Date_(arrow.DateUnit.DAY))).toBe('date-day');
  expect(serializeArrowType(new arrow.Date_(arrow.DateUnit.MILLISECOND))).toBe('date-millisecond');
  expect(serializeArrowType(new arrow.Time(arrow.TimeUnit.SECOND, 32))).toBe('time-second');
  expect(serializeArrowType(new arrow.Time(arrow.TimeUnit.MILLISECOND, 32))).toBe(
    'time-millisecond'
  );
  expect(serializeArrowType(new arrow.Time(arrow.TimeUnit.MICROSECOND, 64))).toBe(
    'time-microsecond'
  );
  expect(serializeArrowType(new arrow.Time(arrow.TimeUnit.NANOSECOND, 64))).toBe('time-nanosecond');
  expect(serializeArrowType(new arrow.Time(99 as arrow.TimeUnit, 64))).toBe('time-second');
  expect(serializeArrowType(new arrow.Timestamp(arrow.TimeUnit.SECOND))).toBe('timestamp-second');
  expect(serializeArrowType(new arrow.Timestamp(arrow.TimeUnit.MILLISECOND))).toBe(
    'timestamp-millisecond'
  );
  expect(serializeArrowType(new arrow.Timestamp(arrow.TimeUnit.MICROSECOND))).toBe(
    'timestamp-microsecond'
  );
  expect(serializeArrowType(new arrow.Timestamp(arrow.TimeUnit.NANOSECOND))).toBe(
    'timestamp-nanosecond'
  );
  expect(serializeArrowType(new arrow.Timestamp(99 as arrow.TimeUnit))).toBe('timestamp-second');
  expect(serializeArrowType(new arrow.Interval(arrow.IntervalUnit.DAY_TIME))).toBe(
    'interval-daytime'
  );
  expect(serializeArrowType(new arrow.Interval(arrow.IntervalUnit.YEAR_MONTH))).toBe(
    'interval-yearmonth'
  );
  expect(serializeArrowType(new arrow.Interval(99 as arrow.IntervalUnit))).toBe('interval-daytime');
});

test('nested and parameterized Arrow types round-trip', () => {
  const valueField = {
    name: 'value',
    type: 'utf8' as const,
    nullable: true,
    metadata: {role: 'value'}
  };
  const keyField = {
    name: 'key',
    type: 'int32' as const,
    nullable: false,
    metadata: {}
  };
  const nestedTypes: DataType[] = [
    {type: 'decimal', bitWidth: 128, precision: 19, scale: 4},
    {type: 'fixed-size-binary', byteWidth: 16},
    {type: 'list', children: [valueField]},
    {type: 'fixed-size-list', listSize: 3, children: [valueField]},
    {type: 'struct', children: [keyField, valueField]},
    {
      type: 'map',
      keysSorted: true,
      children: [
        {
          name: 'entries',
          type: {type: 'struct', children: [keyField, valueField]},
          nullable: false,
          metadata: {}
        }
      ]
    },
    {
      type: 'dictionary',
      id: 7,
      indices: 'int16',
      dictionary: 'utf8',
      isOrdered: true
    }
  ];

  for (const dataType of nestedTypes) {
    expect(serializeArrowType(deserializeArrowType(dataType))).toEqual(dataType);
  }
});

test.each([
  'int8',
  'int16',
  'int32',
  'uint8',
  'uint16',
  'uint32'
] as KeyType[])('dictionary index type %s round-trips', indices => {
  const dataType: DataType = {
    type: 'dictionary',
    id: 1,
    indices,
    dictionary: 'utf8',
    isOrdered: false
  };
  expect(serializeArrowType(deserializeArrowType(dataType))).toEqual(dataType);
});

test('Arrow schema conversion preserves field and schema metadata', () => {
  const schema = {
    fields: [
      {
        name: 'values',
        type: {
          type: 'list' as const,
          children: [{name: 'item', type: 'int32' as const, nullable: false, metadata: {}}]
        },
        nullable: true,
        metadata: {role: 'measure'}
      }
    ],
    metadata: {source: 'coverage'}
  };

  expect(convertArrowToSchema(convertSchemaToArrow(schema))).toEqual(schema);
  expect(convertSchemaToArrow({fields: [], metadata: undefined as never}).metadata.size).toBe(0);
});

test('unsupported Arrow and serialized types report useful errors', () => {
  expect(() => serializeArrowType(new arrow.DurationSecond())).toThrow('arrow type not supported');
  expect(() =>
    serializeArrowType(new arrow.Dictionary(new arrow.Utf8(), new arrow.Int64()))
  ).toThrow('arrow dictionary index type not supported');
  expect(() => deserializeArrowType('int')).toThrow('array type not supported');
  expect(() =>
    deserializeArrowType({
      type: 'sparse-union',
      typeIds: new Int32Array(),
      children: [],
      typeIdToChildIndex: {}
    })
  ).toThrow('array type not supported');
  expect(() =>
    deserializeArrowType({
      type: 'dictionary',
      id: 1,
      indices: 'int64' as KeyType,
      dictionary: 'utf8',
      isOrdered: false
    })
  ).toThrow('schema dictionary index type not supported');
});
