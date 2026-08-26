// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  convertRowsToArrowTable,
  convertSQLColumnsToSchema,
  escapeSqlString,
  getQualifiedTableName,
  quoteSqlIdentifier
} from '../src/sql-utils';
test('sql-utils escapes SQL strings and identifiers', () => {
  expect(escapeSqlString("O'Reilly"), 'escapes single quotes').toBe("O''Reilly");
  expect(quoteSqlIdentifier('has"quote'), 'escapes double quotes').toBe('"has""quote"');
  expect(
    getQualifiedTableName({
      catalogName: 'analytics',
      schemaName: 'public',
      tableName: 'events'
    }),
    'quotes qualified table names'
  ).toBe('"analytics"."public"."events"');
  expect(getQualifiedTableName({tableName: 'events'})).toBe('"events"');
  expect(getQualifiedTableName({schemaName: 'public', tableName: 'events'})).toBe(
    '"public"."events"'
  );
});
test('sql-utils converts rows to Arrow tables and infers nullable primitive types', () => {
  const table = convertRowsToArrowTable([{value: null}, {value: 7}]);
  expect(table.data.numRows, 'creates arrow rows').toBe(2);
  expect(table.schema.fields[0]?.name, 'retains field name').toBe('value');
  expect(table.data.get(1)?.toJSON()?.value, 'preserves later primitive values').toBe(7);
  const emptyTable = convertRowsToArrowTable([]);
  expect(emptyTable.data.numRows, 'handles empty row sets').toBe(0);
  expect(emptyTable.schema.fields.length, 'returns empty schema for empty row sets').toBe(0);

  const populatedTable = convertRowsToArrowTable([{active: true, label: 'ready'}]);
  expect(populatedTable.schema.fields.map(field => field.type)).toEqual(['bool', 'utf8']);
});
test('sql-utils maps SQL column metadata to ordered schema fields', () => {
  const schema = convertSQLColumnsToSchema([
    {
      columnName: 'created_at',
      sqlType: 'TIMESTAMP',
      nullable: true,
      ordinalPosition: 2
    },
    {
      columnName: 'id',
      sqlType: 'BIGINT',
      nullable: false,
      ordinalPosition: 1
    },
    {
      columnName: 'payload',
      sqlType: 'BLOB',
      nullable: true,
      ordinalPosition: 3
    }
  ]);
  expect(
    schema.fields.map(field => field.name),
    'sorts columns by ordinal position'
  ).toEqual(['id', 'created_at', 'payload']);
  expect(schema.fields[0]?.type, 'maps bigint columns').toBe('int64');
  expect(schema.fields[1]?.type, 'maps timestamp columns').toBe('timestamp-millisecond');
  expect(schema.fields[2]?.type, 'maps blob columns').toBe('binary');
});

test.each([
  ['BIGINT', 'int64'],
  ['HUGEINT', 'int64'],
  ['LONG', 'int64'],
  ['INTEGER', 'int32'],
  ['SMALLINT', 'int32'],
  ['TINYINT', 'int32'],
  ['DOUBLE PRECISION', 'float64'],
  ['FLOAT8', 'float64'],
  ['REAL', 'float64'],
  ['FLOAT', 'float64'],
  ['DECIMAL(10, 2)', 'float64'],
  ['NUMERIC', 'float64'],
  ['BOOLEAN', 'bool'],
  ['DATE', 'date-day'],
  ['TIME WITH TIME ZONE', 'timestamp-millisecond'],
  ['TIMESTAMP', 'timestamp-millisecond'],
  ['BLOB', 'binary'],
  ['VARBINARY', 'binary'],
  ['VARCHAR', 'utf8']
])('sql-utils maps %s SQL types to %s', (sqlType, expectedType) => {
  const schema = convertSQLColumnsToSchema([
    {columnName: 'value', sqlType, nullable: true, ordinalPosition: 1}
  ]);

  expect(schema.fields[0]?.type).toBe(expectedType);
});
