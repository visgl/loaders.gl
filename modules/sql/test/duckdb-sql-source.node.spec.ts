import test from 'tape-promise/tape';
import {createDataSource} from '@loaders.gl/core';
import {DuckDBSQLDataSource, DuckDBSQLSource} from '@loaders.gl/sql';

test('DuckDBSQLSource#createDataSource selects DuckDB source from URL', t => {
  const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
    duckdb: {}
  });

  t.ok(dataSource instanceof DuckDBSQLDataSource, 'returns DuckDBSQLDataSource');
  t.end();
});

test('DuckDBSQLSource executes queries and exposes metadata', async t => {
  const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
    duckdb: {}
  }) as DuckDBSQLDataSource;

  await dataSource.queryRows(
    'CREATE TABLE numbers AS SELECT 1 AS value UNION ALL SELECT 2 AS value'
  );

  const rows = await dataSource.queryRows('SELECT * FROM numbers ORDER BY value');
  t.deepEqual(rows, [{value: 1}, {value: 2}], 'returns object rows');

  const arrowTable = await dataSource.queryArrow('SELECT * FROM numbers ORDER BY value');
  t.equal(arrowTable.data.numRows, 2, 'returns Arrow table rows');
  t.equal(arrowTable.data.get(0)?.toJSON()?.value, 1, 'returns Arrow table data');

  const tables = await dataSource.listTables();
  t.ok(
    tables.some(table => table.tableName === 'numbers'),
    'lists created tables'
  );

  const schema = await dataSource.getTableSchema({tableName: 'numbers', schemaName: 'main'});
  t.equal(schema.fields[0]?.name, 'value', 'returns table schema');

  await dataSource.close();
  t.end();
});
