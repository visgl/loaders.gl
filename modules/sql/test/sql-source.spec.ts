// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Schema} from '@loaders.gl/schema';
import {
  SQLDataSource,
  getSQLAdapterFactory,
  parseSQLPredicate,
  registerSQLAdapter
} from '@loaders.gl/sql';
import {convertRowsToArrowTable} from '../src/sql-utils';
import type {
  SQLAdapter,
  SQLCatalogInfo,
  SQLMetadata,
  SQLQueryOptions,
  SQLSchemaInfo,
  SQLSourceOptions,
  SQLTableInfo
} from '@loaders.gl/sql';
class StubSQLDataSource extends SQLDataSource {
  constructor(data: string, options: SQLSourceOptions, sourceType = 'stub-sql') {
    super(data, options, sourceType);
  }
  async getResolvedMetadata(): Promise<SQLMetadata> {
    return await this.getMetadata();
  }
}
test('registerSQLAdapter stores adapter factories', () => {
  const factory = async (): Promise<SQLAdapter> => ({
    capabilities: {
      supportsArrow: false,
      supportsMetadata: true,
      runtime: 'node',
      isDynamic: true
    },
    async connect(): Promise<void> {},
    async close(): Promise<void> {},
    async listCatalogs(): Promise<SQLCatalogInfo[]> {
      return [];
    },
    async listSchemas(): Promise<SQLSchemaInfo[]> {
      return [];
    },
    async listTables(): Promise<SQLTableInfo[]> {
      return [];
    },
    async getTableSchema(): Promise<Schema> {
      return {fields: [], metadata: {}};
    },
    async executeRows(): Promise<Record<string, unknown>[]> {
      return [];
    }
  });
  registerSQLAdapter('registered-sql', factory);
  expect(getSQLAdapterFactory('registered-sql'), 'returns registered factory').toBe(factory);
});
test('SQLDataSource caches metadata, falls back to Arrow conversion, and resets on close', async () => {
  let connectCount = 0;
  let closeCount = 0;
  let metadataCallCount = 0;
  const adapterFactory = async (): Promise<SQLAdapter> => ({
    capabilities: {
      supportsArrow: false,
      supportsMetadata: true,
      runtime: 'both',
      isDynamic: true
    },
    async connect(): Promise<void> {
      connectCount++;
    },
    async close(): Promise<void> {
      closeCount++;
    },
    async listCatalogs(): Promise<SQLCatalogInfo[]> {
      metadataCallCount++;
      return [{catalogName: 'catalog'}];
    },
    async listSchemas(): Promise<SQLSchemaInfo[]> {
      metadataCallCount++;
      return [{catalogName: 'catalog', schemaName: 'public'}];
    },
    async listTables(): Promise<SQLTableInfo[]> {
      metadataCallCount++;
      return [{catalogName: 'catalog', schemaName: 'public', tableName: 'numbers'}];
    },
    async getTableSchema(): Promise<Schema> {
      return {
        fields: [{name: 'value', type: 'int32', nullable: false, metadata: {}}],
        metadata: {}
      };
    },
    async executeRows(
      sqlText: string,
      _options: SQLQueryOptions = {}
    ): Promise<Record<string, unknown>[]> {
      if (sqlText.includes('nulls')) {
        return [{value: null}, {value: 3}];
      }
      return [{value: 1}, {value: 2}];
    }
  });
  const source = new StubSQLDataSource('sql://stub', {
    sql: {
      nodeAdapterFactory: adapterFactory,
      browserAdapterFactory: adapterFactory
    }
  });
  const firstMetadata = await source.getResolvedMetadata();
  const secondMetadata = await source.getResolvedMetadata();
  expect(connectCount, 'connects adapter once').toBe(1);
  expect(metadataCallCount, 'loads metadata once').toBe(3);
  expect(firstMetadata, 'returns cached metadata promise result').toBe(secondMetadata);
  const arrowTable = await source.queryArrow('SELECT * FROM nulls');
  expect(arrowTable.shape, 'returns Arrow table shape').toBe('arrow-table');
  expect(arrowTable.data.numRows, 'converts row results into Arrow rows').toBe(2);
  expect(arrowTable.data.get(1)?.toJSON()?.value, 'preserves row data after conversion').toBe(3);
  await source.close();
  expect(closeCount, 'closes adapter').toBe(1);
  await source.getResolvedMetadata();
  expect(connectCount, 'recreates adapter after close').toBe(2);
  expect(metadataCallCount, 'reloads metadata after close clears cache').toBe(6);
});

test('SQLDataSource delegates discovery and both query result paths', async () => {
  const calls: Array<[string, unknown]> = [];
  const nativeArrowTable = convertRowsToArrowTable([{value: 9}]);
  let closeCount = 0;
  const adapterFactory = async (): Promise<SQLAdapter> => ({
    capabilities: {
      supportsArrow: true,
      supportsMetadata: true,
      runtime: 'both',
      isDynamic: true
    },
    async connect(): Promise<void> {
      calls.push(['connect', null]);
    },
    async close(): Promise<void> {
      closeCount++;
    },
    async listCatalogs(): Promise<SQLCatalogInfo[]> {
      return [{catalogName: 'catalog'}];
    },
    async listSchemas(catalogName?: string): Promise<SQLSchemaInfo[]> {
      calls.push(['listSchemas', catalogName]);
      return [{catalogName, schemaName: 'public'}];
    },
    async listTables(options): Promise<SQLTableInfo[]> {
      calls.push(['listTables', options]);
      return [{...options, tableName: 'numbers'}];
    },
    async getTableSchema(options): Promise<Schema> {
      calls.push(['getTableSchema', options]);
      return {fields: [{name: 'value', type: 'int32', nullable: false}], metadata: {}};
    },
    async executeRows(sqlText, options): Promise<Record<string, unknown>[]> {
      calls.push(['executeRows', {sqlText, options}]);
      return [{value: 2}];
    },
    async executeArrow(sqlText, options) {
      calls.push(['executeArrow', {sqlText, options}]);
      return nativeArrowTable;
    }
  });
  const source = new StubSQLDataSource(
    'duckdb:///:memory:',
    {sql: {nodeAdapterFactory: adapterFactory, browserAdapterFactory: adapterFactory}},
    'duckdb-sql'
  );

  await source.close();
  expect(closeCount).toBe(0);
  await expect(source.listCatalogs()).resolves.toEqual([{catalogName: 'catalog'}]);
  await expect(source.listSchemas('catalog')).resolves.toEqual([
    {catalogName: 'catalog', schemaName: 'public'}
  ]);
  await expect(source.listTables({catalogName: 'catalog', schemaName: 'public'})).resolves.toEqual([
    {catalogName: 'catalog', schemaName: 'public', tableName: 'numbers'}
  ]);
  await expect(
    source.getTableSchema({catalogName: 'catalog', schemaName: 'public', tableName: 'numbers'})
  ).resolves.toMatchObject({fields: [{name: 'value'}]});

  const rows = await source.queryRows(
    {
      tableName: 'numbers',
      columns: ['value'],
      predicate: parseSQLPredicate('value >= :minimum', {preserveParameters: true}),
      limit: 1
    },
    {parameters: {minimum: 2}}
  );
  expect(rows).toEqual([{value: 2}]);
  const compiledCall = calls.find(call => call[0] === 'executeRows')?.[1] as {
    sqlText: string;
    options: SQLQueryOptions;
  };
  expect(compiledCall.sqlText).toContain('WHERE ("value" >= ?)');
  expect(compiledCall.options.parameters).toEqual([2]);

  await expect(source.queryArrow('SELECT 9 AS value')).resolves.toBe(nativeArrowTable);
  expect(calls.some(call => call[0] === 'executeArrow')).toBe(true);
  await source.close();
  expect(closeCount).toBe(1);
});

test('SQLDataSource uses registered factories and rejects unsupported portable dialects', async () => {
  const adapterFactory = async (): Promise<SQLAdapter> => ({
    capabilities: {
      supportsArrow: false,
      supportsMetadata: false,
      runtime: 'both',
      isDynamic: false
    },
    async connect(): Promise<void> {},
    async close(): Promise<void> {},
    async listCatalogs(): Promise<SQLCatalogInfo[]> {
      return [];
    },
    async listSchemas(): Promise<SQLSchemaInfo[]> {
      return [];
    },
    async listTables(): Promise<SQLTableInfo[]> {
      return [];
    },
    async getTableSchema(): Promise<Schema> {
      return {fields: [], metadata: {}};
    },
    async executeRows(): Promise<Record<string, unknown>[]> {
      return [{registered: true}];
    }
  });
  registerSQLAdapter('registry-sql', adapterFactory);
  const source = new StubSQLDataSource('sql://registry', {}, 'registry-sql');

  await expect(source.queryRows('SELECT 1')).resolves.toEqual([{registered: true}]);
  await expect(source.queryRows({tableName: 'numbers'})).rejects.toThrow(
    /Portable table queries are not supported/
  );
});
test('SQLDataSource reports missing adapters with source context', async () => {
  const source = new StubSQLDataSource('sql://missing', {}, 'missing-sql');
  await expect(async () => {
    try {
      await source.queryRows('SELECT 1');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(
        message.includes('missing-sql'),
        'preserves source type in the reported error'
      ).toBeTruthy();
      throw error;
    }
  }, 'reports missing adapter failures').rejects.toThrow(/SQL adapter/);
});
