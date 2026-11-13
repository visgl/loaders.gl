// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Field, Float64, Int32, Schema, Table} from 'apache-arrow';
import {
  convertJSONToArrow,
  JSONTableLoaderWithParser,
  type ConvertJSONToArrowOptions
} from '@loaders.gl/tables/json-table-loader';
import type {Schema as LoadersSchema} from '@loaders.gl/core/schema';

const ROWS = [
  {name: 'Oslo', population: 717710},
  {name: 'Bergen', population: 291940}
];

test.each([
  ['object rows', ROWS],
  ['nested rows', {metadata: {count: 2}, result: {items: ROWS}}],
  ['object-row wrapper', {shape: 'object-row-table', data: ROWS}]
])('convertJSONToArrow accepts %s', (_name, input) => {
  const table = convertJSONToArrow(input);
  expect(table).toBeInstanceOf(Table);
  expect(table.numRows).toBe(2);
  expect(table.getChild('name')?.toArray()).toEqual(['Oslo', 'Bergen']);
  expect(Array.from(table.getChild('population')!)).toEqual([717710, 291940]);
  expect(table).not.toHaveProperty('shape');
});

test.each([
  [
    'array rows',
    [
      [1, 'first'],
      [2, 'second']
    ]
  ],
  [
    'array-row wrapper',
    {
      shape: 'array-row-table',
      data: [
        [1, 'first'],
        [2, 'second']
      ]
    }
  ]
])('convertJSONToArrow accepts %s', (_name, input) => {
  const table = convertJSONToArrow(input);
  expect(table.schema.fields.map(field => field.name)).toEqual(['column1', 'column2']);
  expect(Array.from(table.getChild('column1')!)).toEqual([1, 2]);
  expect(Array.from(table.getChild('column2')!)).toEqual(['first', 'second']);
});

test('convertJSONToArrow infers nested fields without mutating input', () => {
  const rows = Object.freeze([
    Object.freeze({id: 1, details: Object.freeze({active: true}), scores: Object.freeze([2, 3])})
  ]);
  const table = convertJSONToArrow(rows);
  expect(table.getChild('details')?.get(0).active).toBe(true);
  expect(Array.from(table.getChild('scores')?.get(0))).toEqual([2, 3]);
  expect(rows).toEqual([{id: 1, details: {active: true}, scores: [2, 3]}]);
});

test.each([
  ['empty rows', [], 0],
  ['empty nested rows', {items: []}, 0],
  ['empty objects', [{}, {}], 2],
  ['empty array rows', [[], []], 2]
])('convertJSONToArrow preserves %s', (_name, input, rowCount) => {
  const table = convertJSONToArrow(input);
  expect(table.numRows).toBe(rowCount);
  expect(table.numCols).toBe(0);
});

test('convertJSONToArrow chooses the first nested array, including an empty array', () => {
  const table = convertJSONToArrow({metadata: {items: []}, rows: ROWS});
  expect(table.numRows).toBe(0);
});

test.each([
  [null],
  [undefined],
  [42],
  ['[]'],
  [{}],
  [[1, 2]],
  [{items: ['first']}]
])('convertJSONToArrow rejects non-tabular input %j', input => {
  expect(() => convertJSONToArrow(input)).toThrow('convertJSONToArrow: expected a JSON row array');
});

test('convertJSONToArrow rejects non-row tables instead of converting their schema fields', () => {
  const wrappedTable = JSONTableLoaderWithParser.parseTextSync('[{"value": 1}]', {
    json: {shape: 'arrow-table'}
  });
  if (wrappedTable.shape !== 'arrow-table') throw new Error('Expected Arrow table');
  const columnarTable = {
    shape: 'columnar-table',
    schema: wrappedTable.schema,
    data: {value: [1]}
  };
  for (const input of [wrappedTable, wrappedTable.data, columnarTable]) {
    expect(() => convertJSONToArrow(input)).toThrow(
      'convertJSONToArrow: expected a JSON row array'
    );
  }
});

test('convertJSONToArrow supports native and loaders.gl schemas', () => {
  const nativeSchema = new Schema([new Field('value', new Int32(), false)]);
  const loadersSchema: LoadersSchema = {
    fields: [{name: 'value', type: 'int32', nullable: false}],
    metadata: {}
  };
  for (const schema of [nativeSchema, loadersSchema]) {
    const table = convertJSONToArrow([{value: 7}], {schema});
    expect(table.getChild('value')?.type).toBeInstanceOf(Int32);
    expect(table.getChild('value')?.get(0)).toBe(7);
    const emptyTable = convertJSONToArrow([], {schema});
    expect(emptyTable.numRows).toBe(0);
    expect(emptyTable.schema.fields.map(field => field.name)).toEqual(['value']);
  }
});

test('convertJSONToArrow forwards recovery and logger options and preserves source rows', () => {
  const rows = Object.freeze([
    Object.freeze({value: 'invalid'}),
    Object.freeze({value: 'also invalid'})
  ]);
  const schema = new Schema([new Field('value', new Float64(), true)]);
  expect(() => convertJSONToArrow(rows, {schema})).toThrow();
  const warning = vi.fn();
  const options: ConvertJSONToArrowOptions = {
    schema,
    arrowConversion: {onTypeMismatch: 'null'},
    log: {warn: () => warning}
  };
  const table = convertJSONToArrow(rows, options);
  expect(Array.from(table.getChild('value')!)).toEqual([null, null]);
  expect(warning).toHaveBeenCalledTimes(1);
  expect(rows[0].value).toBe('invalid');
});

test('convertJSONToArrow matches JSONTableLoader Arrow conversion', () => {
  const options: ConvertJSONToArrowOptions = {
    schema: new Schema([new Field('value', new Int32(), false)]),
    arrowConversion: {integerConversion: 'clamp-and-round'}
  };
  const rows = [{value: 1.6}];
  const directTable = convertJSONToArrow(rows, options);
  const loadedTable = JSONTableLoaderWithParser.parseTextSync(JSON.stringify(rows), {
    json: {shape: 'arrow-table', ...options}
  });
  expect(loadedTable.shape).toBe('arrow-table');
  if (loadedTable.shape !== 'arrow-table') throw new Error('Expected Arrow table');
  expect(directTable.schema.toString()).toBe(loadedTable.data.schema.toString());
  expect(directTable.toArray().map(row => row.toJSON())).toEqual(
    loadedTable.data.toArray().map(row => row.toJSON())
  );
});
