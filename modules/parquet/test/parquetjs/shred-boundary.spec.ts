// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ParquetSchema} from '../../src/parquetjs/schema/schema';
import {
  materializeColumn,
  materializeColumns,
  materializeRows,
  shredBuffer,
  shredRecord
} from '../../src/parquetjs/schema/shred';

test('Parquet shredding normalizes standard LIST and MAP JavaScript values', () => {
  const schema = new ParquetSchema({
    tags: {
      optional: true,
      logicalType: {type: 'LIST'},
      fields: {
        list: {
          repeated: true,
          fields: {element: {type: 'UTF8', optional: true}}
        }
      }
    },
    attributes: {
      optional: true,
      logicalType: {type: 'MAP'},
      fields: {
        key_value: {
          repeated: true,
          fields: {
            key: {type: 'UTF8'},
            value: {type: 'INT32', optional: true}
          }
        }
      }
    }
  });
  const rowGroup = shredBuffer(schema);

  shredRecord(schema, {tags: ['red', 'green'], attributes: new Map([['size', 3]])}, rowGroup);
  shredRecord(
    schema,
    {
      tags: [],
      attributes: [
        ['weight', 4],
        {key: 'age', value: 5},
        'ignored'
      ]
    },
    rowGroup
  );
  shredRecord(schema, {attributes: {height: 6}}, rowGroup);
  shredRecord(schema, {attributes: 'invalid'}, rowGroup);

  expect(rowGroup.rowCount).toBe(4);
  expect(rowGroup.columnData['tags,list,element'].count).toBeGreaterThan(0);
  expect(rowGroup.columnData['attributes,key_value,key'].count).toBeGreaterThan(0);
  expect(materializeRows(schema, rowGroup)).toHaveLength(4);
  expect(materializeColumns(schema, rowGroup)).toHaveProperty('tags');
  expect(materializeColumns(schema, rowGroup)).toHaveProperty('attributes');
});

test('Parquet shredding rejects absent required and repeated non-repeated values', () => {
  const requiredSchema = new ParquetSchema({name: {type: 'UTF8'}});
  expect(() => shredRecord(requiredSchema, {}, shredBuffer(requiredSchema))).toThrow(
    'missing required field: name'
  );
  expect(() =>
    shredRecord(requiredSchema, {name: ['one', 'two']}, shredBuffer(requiredSchema))
  ).toThrow('too many values for field: name');
});

test('Parquet materialization handles compact bytes, empty columns, and malformed levels', () => {
  const schema = new ParquetSchema({name: {type: 'UTF8', optional: true}});
  const compactBytes = new Uint8Array([97, 98, 99, 100, 101]);
  const rowGroup = {
    rowCount: 2,
    columnData: {
      name: {
        count: 2,
        dlevels: [1, 1],
        rlevels: [0, 0],
        values: [],
        pageHeaders: [],
        byteArrayData: {
          data: compactBytes,
          valueOffsets: new Uint32Array([0, 2, 5])
        }
      }
    }
  } as any;

  expect(materializeRows(schema, rowGroup)).toEqual([{name: 'ab'}, {name: 'cde'}]);
  expect(materializeColumn(schema, rowGroup, 'name')).toEqual(['ab', 'cde']);
  expect(
    materializeColumn(schema, {rowCount: 1, columnData: {name: {count: 0}}} as any, 'name')
  ).toBeUndefined();

  const repeatedSchema = new ParquetSchema({values: {type: 'INT32', repeated: true}});
  expect(() =>
    materializeRows(repeatedSchema, {
      rowCount: 0,
      columnData: {
        values: {count: 1, dlevels: [1], rlevels: [0], values: [1], pageHeaders: []}
      }
    })
  ).toThrow('referenced row 0 of 0');
});

test('Parquet column materialization preserves required typed arrays without copying', () => {
  const schema = new ParquetSchema({value: {type: 'INT32'}});
  const values = new Int32Array([1, 2, 3]);
  const rowGroup = {
    rowCount: 3,
    columnData: {
      value: {
        count: 3,
        dlevels: new Uint8Array(0),
        rlevels: new Uint8Array(0),
        values,
        pageHeaders: []
      }
    }
  } as any;

  expect(materializeColumn(schema, rowGroup, 'value')).toBe(values);
  expect(materializeColumns(schema, rowGroup).value).toBe(values);
  expect(materializeRows(schema, rowGroup)).toEqual([{value: 1}, {value: 2}, {value: 3}]);
});
