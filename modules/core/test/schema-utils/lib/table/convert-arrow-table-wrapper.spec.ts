// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, Field, Int32, List, Struct, Utf8, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  convertArrowTable,
  convertArrowTableBatch,
  convertArrowToSchema
} from '@loaders.gl/core/schema-utils';

const data = new Table({
  label: vectorFromArray(['first', null], new Utf8()),
  nested: vectorFromArray([[1, 2], []], new List(new Field('item', new Int32(), true))),
  record: vectorFromArray(
    [{value: 'a'}, {value: 'b'}],
    new Struct([new Field('value', new Utf8(), true)])
  )
});
const schema = {...convertArrowToSchema(data.schema), metadata: {source: 'fixture'}};
const table = {shape: 'arrow-table' as const, data, schema, source: 'custom'};

test('Arrow wrapper conversion retains identity and caller schema', () => {
  expect(convertArrowTable(table, 'arrow-table')).toBe(table);
  const withoutSchema = {shape: 'arrow-table' as const, data};
  expect(convertArrowTable(withoutSchema, 'arrow-table')).toBe(withoutSchema);
  for (const shape of ['object-row-table', 'array-row-table', 'columnar-table'] as const) {
    const converted = convertArrowTable(table, shape);
    expect(converted.schema).toBe(schema);
    expect(converted.source).toBe('custom');
    expect(convertArrowTable(withoutSchema, shape).schema?.fields.map(field => field.name)).toEqual(
      ['label', 'nested', 'record']
    );
    const empty = convertArrowTable({...table, data: data.slice(0, 0)}, shape);
    expect(empty.schema).toBe(schema);
    expect(
      shape === 'columnar-table'
        ? Object.values(empty.data).every(column => column.length === 0)
        : empty.data.length === 0
    ).toBe(true);
  }
});

test('Arrow row conversion preserves field order, nulls and nested values', () => {
  const objects = convertArrowTable(table, 'object-row-table');
  expect(Object.keys(objects.data[0])).toEqual(['label', 'nested', 'record']);
  expect(objects.data[1].label).toBeNull();
  expect(Array.from(objects.data[0].nested)).toEqual([1, 2]);
  expect(objects.data[0].record.value).toBe('a');
  const arrays = convertArrowTable(table, 'array-row-table');
  expect(arrays.data[0][0]).toBe('first');
  expect(arrays.data[1][0]).toBeNull();
  expect(Array.from(arrays.data[0][1])).toEqual([1, 2]);
  expect(arrays.data[0][2].value).toBe('a');
});

test('Arrow batch conversion retains progress and metadata for every layout', () => {
  const batch = {
    ...table,
    batchType: 'data' as const,
    length: 2,
    bytesUsed: 123,
    cursor: 7,
    schemaType: 'explicit' as const,
    metadata: {source: 'batch'}
  };
  expect(convertArrowTableBatch(batch, 'arrow-table')).toBe(batch);
  for (const shape of ['object-row-table', 'array-row-table', 'columnar-table'] as const) {
    const converted = convertArrowTableBatch(batch, shape);
    expect(converted).toMatchObject({
      shape,
      batchType: 'data',
      length: 2,
      bytesUsed: 123,
      cursor: 7,
      schemaType: 'explicit',
      source: 'custom'
    });
    expect(converted.schema).toBe(schema);
    expect(converted.metadata).toBe(batch.metadata);
  }
});
