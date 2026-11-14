// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSourceSync} from '@loaders.gl/core';
import {DuckDBSQLDataSource, DuckDBSQLSource} from '@loaders.gl/sql';
test('DuckDBSQLSource#createDataSource selects DuckDB source from URL', () => {
  const dataSource = createDataSourceSync('duckdb:///:memory:', [DuckDBSQLSource], {
    duckdb: {}
  });
  expect(dataSource instanceof DuckDBSQLDataSource, 'returns DuckDBSQLDataSource').toBeTruthy();
});
test('DuckDBSQLSource executes queries and exposes metadata', async () => {
  const dataSource = createDataSourceSync('duckdb:///:memory:', [DuckDBSQLSource], {
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
  const dataSource = createDataSourceSync('duckdb:///:memory:', [DuckDBSQLSource], {
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

test('DuckDB Node adapter reports unsupported IPC uploads', async () => {
  const source = new DuckDBSQLDataSource('duckdb:///:memory:', {});
  try {
    await expect(source.insertArrowIPC(new Uint8Array(), {tableName: 'events'})).rejects.toThrow(
      'does not support Arrow IPC uploads'
    );
  } finally {
    await source.close();
  }
});

test('common queries page DuckDB tables, widen integers natively, and fall back for rounding casts', async () => {
  const source = new DuckDBSQLDataSource('duckdb:///:memory:', {core: {name: 'database'}});
  try {
    await source.queryRows('CREATE TABLE values_table (id INTEGER, value DOUBLE)');
    await source.queryRows(
      'INSERT INTO values_table VALUES (1, 1.9), (2, 2.9), (3, 3.9), (4, NULL)'
    );
    const table = await source.getTable('values_table');
    const statements: string[] = [];
    const queryRows = source.queryRows.bind(source);
    source.queryRows = async (statement, options) => {
      if (typeof statement === 'string') statements.push(statement);
      return queryRows(statement, options);
    };
    const {query} = await import('@loaders.gl/core/query');
    const {parseSQLQuery} = await import('@loaders.gl/core/query/query');
    for (const offset of [0, 1]) {
      const result = await query(
        `SELECT CAST(id AS BIGINT) AS result WHERE CAST(id AS BIGINT) >= 2 LIMIT 1 OFFSET ${offset}`,
        {source: table, sqlParser: parseSQLQuery}
      );
      expect(result.getChild('result')?.get(0)).toBe(BigInt(offset + 2));
      expect(statements.at(-1)).toMatch(new RegExp(`CAST.*WHERE CAST.*LIMIT 1 OFFSET ${offset}$`));
    }
    const fallback = await query('SELECT CAST(value AS INTEGER) AS result LIMIT 1 OFFSET 1', {
      source: table,
      sqlParser: parseSQLQuery
    });
    expect(fallback.getChild('result')?.get(0)).toBe(2);
    expect(statements.at(-1)).toMatch(/SELECT "value".*LIMIT 1 OFFSET 1$/);
    const named = await query(
      {from: {source: 'database', table: 'values_table'}, limit: 1},
      {sources: [source]}
    );
    expect(named.getChild('id')?.get(0)).toBe(1);
  } finally {
    await source.close();
  }
});

test('common queries combine native DuckDB casts and residual Arrow expressions', async () => {
  const source = new DuckDBSQLDataSource('duckdb:///:memory:', {});
  try {
    await source.queryRows('CREATE TABLE mixed (id INTEGER, fraction DOUBLE)');
    await source.queryRows('INSERT INTO mixed VALUES (1, 1e30), (2, 2.9), (NULL, 3.9)');
    const table = await source.getTable('mixed');
    const statements: string[] = [];
    const queryRows = source.queryRows.bind(source);
    source.queryRows = (statement, options) => {
      if (typeof statement === 'string') statements.push(statement);
      return queryRows(statement, options);
    };
    const {query} = await import('@loaders.gl/core/query');
    const {parseSQLQuery} = await import('@loaders.gl/core/query/query');
    const projection =
      'SELECT CAST(id AS DOUBLE PRECISION) AS wide, CAST(fraction AS INTEGER) AS truncated';
    const result = await query(projection + ' LIMIT 2 OFFSET 1', {
      source: table,
      sqlParser: parseSQLQuery
    });
    expect(result.toArray().map(row => row.toJSON())).toEqual([
      {wide: 2, truncated: 2},
      {wide: null, truncated: 3}
    ]);
    expect(statements.at(-1)).toMatch(/CAST\("id" AS DOUBLE\).*LIMIT 2 OFFSET 1$/);
    expect(statements.at(-1)).not.toContain('AS INTEGER');
    await expect(query(projection, {source: table, sqlParser: parseSQLQuery})).rejects.toThrow(
      /overflow/i
    );
    const reads = statements.length;
    const empty = await query(projection + ' LIMIT 0', {source: table, sqlParser: parseSQLQuery});
    expect(empty.schema.names).toEqual(['wide', 'truncated']);
    expect(empty.numRows).toBe(0);
    expect(statements).toHaveLength(reads);
  } finally {
    await source.close();
  }
});
