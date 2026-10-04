// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Field, Schema} from '@loaders.gl/schema';
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow,
  makeNDJSONArrowBatchIterator
} from '../src/lib/parsers/convert-row-table-to-arrow';

/** Creates one-field schema metadata for focused conversion tests. */
function createSchema(type: Field['type'], nullable = false): Schema {
  return {fields: [{name: 'value', type, nullable}], metadata: {source: 'fixture'}};
}

/** Emits row batches without a transport or filesystem dependency. */
async function* yieldRows(rows: Record<string, unknown>[][]) {
  for (const data of rows) {
    yield {
      batchType: 'data' as const,
      shape: 'object-row-table' as const,
      data,
      length: data.length
    };
  }
}

test.each([
  ['int64', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ['uint64', 0, Number.MAX_SAFE_INTEGER]
] as const)('JSON Arrow %s enforces safe integer bounds and rounds recovery values', (type, minimum, maximum) => {
  const table = convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      data: [
        {value: minimum},
        {value: maximum},
        {value: -Infinity},
        {value: Infinity},
        {value: NaN},
        {value: 1.6}
      ]
    },
    {schema: createSchema(type), arrowConversion: {integerConversion: 'clamp-and-round'}}
  );
  expect(Array.from(table.data.getChild('value')!.toArray(), value => Number(value))).toEqual([
    minimum,
    maximum,
    minimum,
    maximum,
    minimum,
    2
  ]);
  expect(() =>
    convertRowTableToArrowTable(
      {
        shape: 'object-row-table',
        data: [{value: maximum + 1}]
      },
      {schema: createSchema(type)}
    )
  ).toThrow('expected integer');
});

test.each([
  ['bool', 1, 'boolean'],
  ['float64', '1', 'number'],
  ['binary', 'bytes', 'binary'],
  ['date-day', 1, 'Date'],
  ['timestamp-second', '2020-01-01', 'Date'],
  ['null', 1, 'null'],
  ['utf8', false, 'string'],
  [{type: 'list', children: [{name: 'item', type: 'float64', nullable: true}]}, null, 'list'],
  [{type: 'struct', children: [{name: 'child', type: 'bool', nullable: true}]}, null, 'struct']
] as const)('JSON Arrow reports the expected type for %j', (type, value, expected) => {
  const fieldType = type as Field['type'];
  expect(() =>
    convertRowTableToArrowTable(
      {
        shape: 'object-row-table',
        data: [{value}]
      },
      {schema: createSchema(fieldType)}
    )
  ).toThrow(`expected ${expected}`);
});

test('JSON Arrow validates nested struct values and reports child paths', () => {
  const schema = createSchema(
    {type: 'struct', children: [{name: 'child', type: 'bool', nullable: true}]},
    true
  );
  expect(() =>
    convertRowTableToArrowTable({shape: 'object-row-table', data: [{value: []}]}, {schema})
  ).toThrow('expected struct');
  expect(() =>
    convertRowTableToArrowTable(
      {shape: 'object-row-table', data: [{value: {child: true, extra: 3}}]},
      {schema}
    )
  ).toThrow('unexpected field value.extra');
  expect(() =>
    convertRowTableToArrowTable({shape: 'object-row-table', data: [{value: {}}]}, {schema})
  ).toThrow('missing field value.child');

  const table = convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      data: [{value: []}, {value: {}}, {value: {child: false, extra: 3}}]
    },
    {
      schema,
      arrowConversion: {
        onTypeMismatch: 'null',
        onMissingField: 'null',
        onExtraField: 'drop',
        logRecoveries: false
      }
    }
  );
  expect(table.data.getChild('value')!.get(0)).toBeNull();
  expect({...table.data.getChild('value')!.get(1)}).toEqual({child: null});
  expect({...table.data.getChild('value')!.get(2)}).toEqual({child: false});
});

test('JSON Arrow recovery refuses nulls for required integers and missing columns', () => {
  expect(() =>
    convertRowTableToArrowTable(
      {shape: 'object-row-table', data: [{value: 2.5}]},
      {
        schema: createSchema('int16'),
        arrowConversion: {integerConversion: 'null'}
      }
    )
  ).toThrow('expected integer');
  expect(() =>
    convertRowTableToArrowTable(
      {shape: 'array-row-table', data: [[]]},
      {
        schema: createSchema('bool'),
        arrowConversion: {onMissingField: 'null'}
      }
    )
  ).toThrow('missing field value');
  const table = convertRowTableToArrowTable(
    {shape: 'array-row-table', data: [[], [true, 'drop']]},
    {
      schema: createSchema('bool', true),
      arrowConversion: {onMissingField: 'null', onExtraField: 'drop', logRecoveries: false}
    }
  );
  expect(table.data.getChild('value')!.get(0)).toBeNull();
  expect(table.data.getChild('value')!.get(1)).toBe(true);
});

test('JSON Arrow inference merges nested lists without mutating input rows', () => {
  const rows = [{value: [[null, 1], [2]]}, {value: [[3], [null]]}];
  const table = convertRowTableToArrowTable({shape: 'object-row-table', data: rows});
  expect(table.schema?.fields).toEqual([
    {
      name: 'value',
      nullable: true,
      type: {
        type: 'list',
        children: [
          {
            name: 'item',
            nullable: true,
            type: {
              type: 'list',
              children: [{name: 'item', type: 'float64', nullable: true}]
            }
          }
        ]
      }
    }
  ]);
  expect(Array.from(table.data.getChild('value')!.get(0).get(0))).toEqual([null, 1]);
  expect(rows).toEqual([{value: [[null, 1], [2]]}, {value: [[3], [null]]}]);
});

test('JSON Arrow binary conversion respects ArrayBuffer and typed view byte ranges', () => {
  const bytes = new Uint8Array([99, 1, 2, 3, 88]);
  const table = convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      data: [
        {value: new Uint8Array([4, 5]).buffer},
        {value: bytes.subarray(1, 4)},
        {value: new DataView(bytes.buffer, 2, 2)}
      ]
    },
    {schema: createSchema('binary')}
  );
  expect(Array.from(table.data.getChild('value')!, value => Array.from(value))).toEqual([
    [4, 5],
    [1, 2, 3],
    [2, 3]
  ]);
});

test('JSON Arrow batch adapters enforce supplied schemas from the first empty batch', async () => {
  const schema = createSchema('bool', true);
  for (const adapt of [makeNDJSONArrowBatchIterator, convertTableBatchesToArrow]) {
    const iterator = adapt(yieldRows([[], [{value: true}], [{}]]), {
      schema,
      arrowConversion: {onMissingField: 'null', logRecoveries: false}
    })[Symbol.asyncIterator]();
    expect((await iterator.next()).value?.data.numRows).toBe(0);
    const first = (await iterator.next()).value;
    expect(first?.schema.metadata).toEqual({source: 'fixture'});
    expect(first?.data.getChild('value')!.get(0)).toBe(true);
    expect((await iterator.next()).value?.data.getChild('value')!.get(0)).toBeNull();
    expect((await iterator.next()).done).toBe(true);
  }
});
