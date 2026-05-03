import test from 'tape-promise/tape';

import {
  convertRowsToArrowTable,
  convertSQLColumnsToSchema,
  escapeSqlString,
  getQualifiedTableName,
  quoteSqlIdentifier
} from '../src/sql-utils';

test('sql-utils escapes SQL strings and identifiers', t => {
  t.equal(escapeSqlString("O'Reilly"), "O''Reilly", 'escapes single quotes');
  t.equal(quoteSqlIdentifier('has"quote'), '"has""quote"', 'escapes double quotes');
  t.equal(
    getQualifiedTableName({
      catalogName: 'analytics',
      schemaName: 'public',
      tableName: 'events'
    }),
    '"analytics"."public"."events"',
    'quotes qualified table names'
  );
  t.end();
});

test('sql-utils converts rows to Arrow tables and infers nullable primitive types', t => {
  const table = convertRowsToArrowTable([{value: null}, {value: 7}]);
  t.equal(table.data.numRows, 2, 'creates arrow rows');
  t.equal(table.schema.fields[0]?.name, 'value', 'retains field name');
  t.equal(table.data.get(1)?.toJSON()?.value, 7, 'preserves later primitive values');

  const emptyTable = convertRowsToArrowTable([]);
  t.equal(emptyTable.data.numRows, 0, 'handles empty row sets');
  t.equal(emptyTable.schema.fields.length, 0, 'returns empty schema for empty row sets');
  t.end();
});

test('sql-utils maps SQL column metadata to ordered schema fields', t => {
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

  t.deepEqual(
    schema.fields.map(field => field.name),
    ['id', 'created_at', 'payload'],
    'sorts columns by ordinal position'
  );
  t.equal(schema.fields[0]?.type, 'int64', 'maps bigint columns');
  t.equal(schema.fields[1]?.type, 'timestamp-millisecond', 'maps timestamp columns');
  t.equal(schema.fields[2]?.type, 'binary', 'maps blob columns');
  t.end();
});
