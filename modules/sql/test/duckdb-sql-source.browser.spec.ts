// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {DuckDBSQLDataSource} from '@loaders.gl/sql';

const duckdbMocks = vi.hoisted(() => {
  const statement = {query: vi.fn(), close: vi.fn()};
  const connection = {query: vi.fn(), prepare: vi.fn(async () => statement), close: vi.fn()};
  const database = {
    instantiate: vi.fn(),
    connect: vi.fn(async () => connection),
    terminate: vi.fn()
  };
  const worker = {terminate: vi.fn()};
  return {statement, connection, database, worker};
});

vi.mock('@duckdb/duckdb-wasm', () => ({
  ConsoleLogger: class ConsoleLogger {},
  getJsDelivrBundles: vi.fn(() => ({mvp: {mainModule: 'default.wasm', mainWorker: 'default.js'}})),
  selectBundle: vi.fn(async () => ({mainModule: 'default.wasm', mainWorker: 'default.js'})),
  createWorker: vi.fn(async () => duckdbMocks.worker),
  AsyncDuckDB: class AsyncDuckDB {
    instantiate = duckdbMocks.database.instantiate;
    connect = duckdbMocks.database.connect;
    terminate = duckdbMocks.database.terminate;
  }
}));

function createResult(rows: Record<string, unknown>[]): arrow.Table {
  const columns = Object.fromEntries(
    Object.keys(rows[0] || {}).map(key => [key, rows.map(row => row[key])])
  );
  return arrow.tableFromArrays(columns);
}

test('DuckDB browser adapter supports queries, metadata, parameters, and cleanup', async () => {
  duckdbMocks.connection.query.mockImplementation(async (sqlText: string) => {
    if (sqlText.includes('information_schema.schemata') && sqlText.includes('DISTINCT')) {
      return createResult([{catalog_name: 'memory'}]);
    }
    if (sqlText.includes('information_schema.schemata')) {
      return createResult([{catalog_name: 'memory', schema_name: 'main'}]);
    }
    if (sqlText.includes('information_schema.tables')) {
      return createResult([
        {
          table_catalog: 'memory',
          table_schema: 'main',
          table_name: 'events',
          table_type: 'BASE TABLE'
        }
      ]);
    }
    if (sqlText.includes('information_schema.columns')) {
      return createResult([
        {
          table_catalog: 'memory',
          table_schema: 'main',
          table_name: 'events',
          column_name: 'id',
          data_type: 'INTEGER',
          is_nullable: 'NO',
          ordinal_position: 1
        }
      ]);
    }
    return createResult([{value: 1}]);
  });
  duckdbMocks.statement.query.mockResolvedValue(createResult([{value: 2}]));

  const source = new DuckDBSQLDataSource('duckdb:///:memory:', {
    duckdb: {
      bundles: {mainModule: 'custom.wasm'},
      workerUrl: 'custom-worker.js'
    }
  });
  expect(await source.queryRows('SELECT 1 AS value')).toEqual([{value: 1}]);
  expect(await source.queryRows('SELECT ? AS value', {parameters: {value: 2}})).toEqual([
    {value: 2}
  ]);
  expect(duckdbMocks.statement.query).toHaveBeenCalledWith(2);
  expect(duckdbMocks.statement.close).toHaveBeenCalled();

  expect(await source.listCatalogs()).toEqual([{catalogName: 'memory'}]);
  expect(await source.listSchemas('memory')).toEqual([{catalogName: 'memory', schemaName: 'main'}]);
  expect(await source.listTables({catalogName: 'memory', schemaName: 'main'})).toEqual([
    {
      catalogName: 'memory',
      schemaName: 'main',
      tableName: 'events',
      tableType: 'BASE TABLE'
    }
  ]);
  const schema = await source.getTableSchema({
    catalogName: 'memory',
    schemaName: 'main',
    tableName: 'events'
  });
  expect(schema.fields[0]?.name).toBe('id');
  expect((await source.queryArrow('SELECT 1 AS value')).data.numRows).toBe(1);

  await source.close();
  expect(duckdbMocks.connection.close).toHaveBeenCalled();
  expect(duckdbMocks.database.terminate).toHaveBeenCalled();
  expect(duckdbMocks.worker.terminate).toHaveBeenCalled();
});
