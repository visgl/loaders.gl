// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {encode, parse} from '@loaders.gl/core';
import {ParquetJSWriter, ParquetJSLoader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';

let fixture: ArrayBuffer;
const values = [
  {
    signed8: -3, signed16: -1000, unsigned16: 65535, unsigned32: 4294967295,
    measurement: 1.25, text: 'first', bytes: new Uint8Array([1, 2])
  },
  {
    signed8: null, signed16: null, unsigned16: null, unsigned32: null,
    measurement: null, text: null, bytes: null
  },
  {
    signed8: 127, signed16: 32767, unsigned16: 101, unsigned32: 200,
    measurement: 3.5, text: '', bytes: new Uint8Array(0)
  },
  {
    signed8: -128, signed16: -32768, unsigned16: 0, unsigned32: 0,
    measurement: -2.25, text: 'last', bytes: new Uint8Array([3])
  }
];

beforeAll(async () => {
  const fields = [
    {name: 'signed8', type: 'int8'},
    {name: 'signed16', type: 'int16'},
    {name: 'unsigned16', type: 'uint16'},
    {name: 'unsigned32', type: 'uint32'},
    {name: 'measurement', type: 'float32'},
    {name: 'text', type: 'utf8'},
    {name: 'bytes', type: 'binary'}
  ] as const;
  const input: ObjectRowTable = {
    shape: 'object-row-table', data: values,
    schema: {fields: fields.map(field => ({...field, nullable: true})), metadata: {}}
  };
  fixture = await encode(input, ParquetJSWriter, {
    worker: false,
    parquet: {dictionary: false, compression: 'UNCOMPRESSED', rowGroupSize: 4}
  });
});

test.each([1, 2, 3])('Parquet Arrow preserves nulls and narrow types with offset %i', async offset => {
  const table = await parse(fixture, ParquetJSLoader, {
    worker: false, parquet: {shape: 'arrow-table', offset, batchSize: 1}
  });
  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') throw new Error('Expected Arrow table');
  expect(table.data.numRows).toBe(4 - offset);
  for (const name of Object.keys(values[0]) as Array<keyof (typeof values)[number]>) {
    expect(Array.from(table.data.getChild(name)!)).toEqual(values.slice(offset).map(row => row[name]));
  }
  expect(table.data.schema.fields.map(field => field.type.toString())).toEqual([
    'Int8', 'Int16', 'Uint16', 'Uint32', 'Float32', 'Utf8', 'Binary'
  ]);
});

test('Parquet Arrow preserves empty projected schema in source order beyond the final row', async () => {
  const result = await parse(fixture, ParquetJSLoader, {
    worker: false,
    parquet: {shape: 'arrow-table', offset: 100, columns: ['text', 'unsigned16']}
  });
  if (result.shape !== 'arrow-table') throw new Error('Expected Arrow table');
  expect(result.data.numRows).toBe(0);
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['unsigned16', 'text']);
});
