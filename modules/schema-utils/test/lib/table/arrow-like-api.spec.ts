// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import type {Table} from '@loaders.gl/schema';

import {ArrowLikeField} from '../../../src/lib/table/arrow-api/arrow-like-field';
import {ArrowLikeSchema} from '../../../src/lib/table/arrow-api/arrow-like-schema';
import {ArrowLikeTable} from '../../../src/lib/table/arrow-api/arrow-like-table';
import {
  Binary,
  Bool,
  DataType,
  DateDay,
  DateMillisecond,
  FixedSizeList,
  Float16,
  Float32,
  Float64,
  Int8,
  Int16,
  Int32,
  Int64,
  IntervalDayTime,
  IntervalYearMonth,
  Null,
  Struct,
  TimeMillisecond,
  TimeSecond,
  TimestampMicrosecond,
  TimestampMillisecond,
  TimestampNanosecond,
  TimestampSecond,
  Type,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Utf8
} from '../../../src/lib/table/arrow-api/arrow-like-type';

const DATA_TYPE_GUARDS = [
  ['isNull', Type.Null],
  ['isInt', Type.Int],
  ['isFloat', Type.Float],
  ['isBinary', Type.Binary],
  ['isUtf8', Type.Utf8],
  ['isBool', Type.Bool],
  ['isDecimal', Type.Decimal],
  ['isDate', Type.Date],
  ['isTime', Type.Time],
  ['isTimestamp', Type.Timestamp],
  ['isInterval', Type.Interval],
  ['isList', Type.List],
  ['isStruct', Type.Struct],
  ['isUnion', Type.Union],
  ['isFixedSizeBinary', Type.FixedSizeBinary],
  ['isFixedSizeList', Type.FixedSizeList],
  ['isMap', Type.Map],
  ['isDictionary', Type.Dictionary]
] as const;

test.each(DATA_TYPE_GUARDS)('DataType.%s recognizes its type id', (guardName, typeId) => {
  const guard = DataType[guardName] as (value: unknown) => boolean;

  expect(guard({typeId})).toBe(true);
  expect(guard({typeId: Type.NONE})).toBe(false);
  expect(guard(null)).toBeFalsy();
});

test('DataType compares by identity and exposes a default type id', () => {
  const dataType = new DataType();

  expect(dataType.typeId).toBe(Type.NONE);
  expect(dataType.compareTo(dataType)).toBe(true);
  expect(dataType.compareTo(new DataType())).toBe(false);
});

test.each([
  ['Null', new Null(), Type.Null],
  ['Bool', new Bool(), Type.Bool],
  ['Int8', new Int8(), Type.Int],
  ['Int16', new Int16(), Type.Int],
  ['Int32', new Int32(), Type.Int],
  ['Int64', new Int64(), Type.Int],
  ['Uint8', new Uint8(), Type.Int],
  ['Uint16', new Uint16(), Type.Int],
  ['Uint32', new Uint32(), Type.Int],
  ['Uint64', new Uint64(), Type.Int],
  ['Float16', new Float16(), Type.Float],
  ['Float32', new Float32(), Type.Float],
  ['Float64', new Float64(), Type.Float],
  ['Binary', new Binary(), Type.Binary],
  ['Utf8', new Utf8(), Type.Utf8],
  ['Date32', new DateDay(), Type.Date],
  ['Date64', new DateMillisecond(), Type.Date],
  ['Time32', new TimeSecond(), Type.Time],
  ['Time32', new TimeMillisecond(), Type.Time],
  ['Timestamp', new TimestampSecond('UTC'), Type.Timestamp],
  ['Timestamp', new TimestampMillisecond(), Type.Timestamp],
  ['Timestamp', new TimestampMicrosecond(), Type.Timestamp],
  ['Timestamp', new TimestampNanosecond(), Type.Timestamp],
  ['Interval', new IntervalDayTime(), Type.Interval],
  ['Interval', new IntervalYearMonth(), Type.Interval]
] as const)('%s Arrow-like type exposes its runtime API', (expectedText, dataType, typeId) => {
  expect(dataType.typeId).toBe(typeId);
  expect(dataType.toString()).toContain(expectedText);
  expect(Object.prototype.toString.call(dataType)).toContain(dataType[Symbol.toStringTag]);
});

test('nested Arrow-like types expose their child fields', () => {
  const valueField = new ArrowLikeField('value', new Utf8(), true);
  const fixedSizeList = new FixedSizeList(3, valueField);
  const struct = new Struct([valueField]);

  expect(fixedSizeList.typeId).toBe(Type.FixedSizeList);
  expect(fixedSizeList.valueField).toBe(valueField);
  expect(fixedSizeList.valueType).toBe(valueField.type);
  expect(fixedSizeList.toString()).toContain('FixedSizeList[3]');
  expect(fixedSizeList[Symbol.toStringTag]).toBe('FixedSizeList');

  expect(struct.typeId).toBe(Type.Struct);
  expect(struct.toString()).toContain('value');
  expect(struct[Symbol.toStringTag]).toBe('Struct');
});

test('ArrowLikeField clones, compares, and formats field metadata', () => {
  const type = new Utf8();
  const metadata = new Map([['role', 'label']]);
  const field = new ArrowLikeField('name', type, true, metadata);
  const clone = field.clone();

  expect(field.typeId).toBe(Type.Utf8);
  expect(clone).not.toBe(field);
  expect(clone.compareTo(field)).toBe(true);
  expect(field.toString()).toContain('nullable');
  expect(field.toString()).toContain('metadata');

  expect(field.compareTo(new ArrowLikeField('other', type, true, metadata))).toBe(false);
  expect(field.compareTo(new ArrowLikeField('name', new Utf8(), true, metadata))).toBe(false);
  expect(field.compareTo(new ArrowLikeField('name', type, false, metadata))).toBe(false);
  expect(field.compareTo(new ArrowLikeField('name', type, true, new Map()))).toBe(false);

  const minimalField = new ArrowLikeField('minimal', type, false, null as never);
  expect(minimalField.toString()).not.toContain('nullable');
  expect(minimalField.toString()).not.toContain('metadata');
});

test('ArrowLikeSchema selects, compares, assigns, and merges metadata', () => {
  const metadata = new Map([['source', 'left']]);
  const fields = [
    new ArrowLikeField('id', new Int32(), false),
    new ArrowLikeField('name', new Utf8(), true)
  ];
  const schema = new ArrowLikeSchema(fields, metadata);
  const equalSchema = new ArrowLikeSchema(fields, metadata);

  expect(schema.compareTo(equalSchema)).toBe(true);
  expect(schema.compareTo(new ArrowLikeSchema(fields, new Map(metadata)))).toBe(false);
  expect(schema.compareTo(new ArrowLikeSchema(fields.slice(0, 1), metadata))).toBe(false);
  expect(
    schema.compareTo(
      new ArrowLikeSchema(
        [new ArrowLikeField('other', fields[0].type), new ArrowLikeField('name', fields[1].type)],
        metadata
      )
    )
  ).toBe(false);

  expect(schema.select('name', 'missing').fields.map(field => field.name)).toEqual(['name']);
  expect(schema.selectAt(1, 99).fields.map(field => field.name)).toEqual(['name']);

  const assignedFields = schema.assign([
    new ArrowLikeField('name', new Binary(), false),
    new ArrowLikeField('active', new Bool(), false)
  ]);
  expect(assignedFields.fields.map(field => field.name)).toEqual(['id', 'name', 'active']);
  expect(assignedFields.fields[1].type).toBeInstanceOf(Binary);
  expect(assignedFields.metadata).toBe(metadata);

  const assignedSchema = schema.assign(
    new ArrowLikeSchema([new ArrowLikeField('active', new Bool())], {owner: 'right'})
  );
  expect(Object.fromEntries(assignedSchema.metadata)).toEqual({source: 'left', owner: 'right'});
  expect(assignedSchema.fields.map(field => field.name)).toEqual(['id', 'name', 'active']);
});

test('ArrowLikeTable accesses columnar, Arrow, row, and GeoJSON tables', () => {
  const columnarTable = new ArrowLikeTable({
    shape: 'columnar-table',
    data: {id: new Uint8Array([1, 2]), name: ['a', 'b']}
  } as Table);

  expect(columnarTable.length).toBe(2);
  expect(columnarTable.numCols).toBe(2);
  expect(columnarTable.data).toBe(columnarTable.table.data);
  expect(columnarTable.getChild('name').get(1)).toBe('b');
  expect(columnarTable.getChild('id').toArray()).toEqual(new Uint8Array([1, 2]));

  const arrowData = arrow.tableFromArrays({id: [3, 4]});
  const arrowTable = new ArrowLikeTable({
    shape: 'arrow-table',
    schema: {fields: [{name: 'id', type: 'int32', nullable: false}], metadata: {}},
    data: arrowData
  } as Table);
  expect(Array.from(arrowTable.getChild('id').toArray())).toEqual([3, 4]);

  const rowTable = new ArrowLikeTable({
    shape: 'object-row-table',
    data: [{id: 5}]
  } as Table);
  expect(rowTable.getChild('id').get(0)).toBe(5);
  expect(() => rowTable.getChild('id').toArray()).toThrow('object-row-table');

  const features = [{type: 'Feature', geometry: null, properties: {id: 6}}];
  const geojsonTable = new ArrowLikeTable({
    shape: 'geojson-table',
    schema: {fields: [{name: 'id', type: 'int32', nullable: false}], metadata: {}},
    features
  } as unknown as Table);
  expect(geojsonTable.data).toBe(features);
});
