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

test('DuckDBSQLSource exposes complete filtered metadata and lifecycle behavior', async () => {
  const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
    duckdb: {accessMode: 'read_write'}
  }) as DuckDBSQLDataSource;

  await dataSource.queryRows(`CREATE SCHEMA analytics`);
  await dataSource.queryRows(`CREATE TABLE analytics.events (id INTEGER NOT NULL, label VARCHAR)`);

  const catalogs = await dataSource.listCatalogs();
  expect(catalogs.some(catalog => catalog.catalogName === 'memory')).toBe(true);

  const schemas = await dataSource.listSchemas('memory');
  expect(schemas).toContainEqual({catalogName: 'memory', schemaName: 'analytics'});

  const tables = await dataSource.listTables({catalogName: 'memory', schemaName: 'analytics'});
  expect(tables).toContainEqual({
    catalogName: 'memory',
    schemaName: 'analytics',
    tableName: 'events',
    tableType: 'BASE TABLE'
  });

  const schema = await dataSource.getTableSchema({
    catalogName: 'memory',
    schemaName: 'analytics',
    tableName: 'events'
  });
  expect(schema.fields.map(field => [field.name, field.nullable])).toEqual([
    ['id', false],
    ['label', true]
  ]);

  await dataSource.close();
  await dataSource.close();
});

test('DuckDBSQLSource validates unsupported remote adapters and URL forms', async () => {
  const remoteSource = new DuckDBSQLDataSource('duckdb:///:memory:', {
    duckdb: {remoteUrl: 'https://example.com/database.duckdb'}
  });
  await expect(remoteSource.queryRows('SELECT 1')).rejects.toThrow(
    'Remote DuckDB adapters are not implemented'
  );

  const encodedPathSource = new DuckDBSQLDataSource('duckdb:///tmp/encoded%20database.duckdb', {
    duckdb: {databasePath: ':memory:'}
  });
  await expect(
    encodedPathSource.queryRows('SELECT ?::INTEGER AS value', {parameters: [7]})
  ).resolves.toEqual([{value: 7}]);
  await encodedPathSource.close();
});
