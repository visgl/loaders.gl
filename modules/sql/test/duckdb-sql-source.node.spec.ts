// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {DuckDBSQLDataSource, DuckDBSQLSource} from '@loaders.gl/sql';
test('DuckDBSQLSource#createDataSource selects DuckDB source from URL', () => {
  const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
    duckdb: {}
  });
  expect(dataSource instanceof DuckDBSQLDataSource, 'returns DuckDBSQLDataSource').toBeTruthy();
});
test('DuckDBSQLSource executes queries and exposes metadata', async () => {
  const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
    duckdb: {}
  }) as DuckDBSQLDataSource;
  await dataSource.queryRows(
    'CREATE TABLE numbers AS SELECT 1 AS value UNION ALL SELECT 2 AS value'
  );
  const rows = await dataSource.queryRows('SELECT * FROM numbers ORDER BY value');
  expect(rows, 'returns object rows').toEqual([{value: 1}, {value: 2}]);
  const plannedRows = await dataSource.queryRows({
    tableName: 'numbers',
    columns: ['value'],
    predicate: {op: '>=', args: [{property: 'value'}, 2]},
    limit: 1
  });
  expect(plannedRows, 'compiles and executes a portable table query').toEqual([{value: 2}]);
  const arrowTable = await dataSource.queryArrow('SELECT * FROM numbers ORDER BY value');
  expect(arrowTable.data.numRows, 'returns Arrow table rows').toBe(2);
  expect(arrowTable.data.get(0)?.toJSON()?.value, 'returns Arrow table data').toBe(1);
  const tables = await dataSource.listTables();
  expect(
    tables.some(table => table.tableName === 'numbers'),
    'lists created tables'
  ).toBeTruthy();
  const schema = await dataSource.getTableSchema({tableName: 'numbers', schemaName: 'main'});
  expect(schema.fields[0]?.name, 'returns table schema').toBe('value');
  await dataSource.close();
});
