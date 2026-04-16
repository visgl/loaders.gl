import test from 'tape-promise/tape';
import type {Schema} from '@loaders.gl/schema';

import {SQLDataSource, registerSQLAdapter, getSQLAdapterFactory} from '@loaders.gl/sql';

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

test('registerSQLAdapter stores adapter factories', t => {
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

  t.equal(getSQLAdapterFactory('registered-sql'), factory, 'returns registered factory');
  t.end();
});

test('SQLDataSource caches metadata, falls back to Arrow conversion, and resets on close', async t => {
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
  t.equal(connectCount, 1, 'connects adapter once');
  t.equal(metadataCallCount, 3, 'loads metadata once');
  t.equal(firstMetadata, secondMetadata, 'returns cached metadata promise result');

  const arrowTable = await source.queryArrow('SELECT * FROM nulls');
  t.equal(arrowTable.shape, 'arrow-table', 'returns Arrow table shape');
  t.equal(arrowTable.data.numRows, 2, 'converts row results into Arrow rows');
  t.equal(arrowTable.data.get(1)?.toJSON()?.value, 3, 'preserves row data after conversion');

  await source.close();
  t.equal(closeCount, 1, 'closes adapter');

  await source.getResolvedMetadata();
  t.equal(connectCount, 2, 'recreates adapter after close');
  t.equal(metadataCallCount, 6, 'reloads metadata after close clears cache');
  t.end();
});

test('SQLDataSource reports missing adapters with source context', async t => {
  const source = new StubSQLDataSource('sql://missing', {}, 'missing-sql');

  await t.rejects(
    async () => {
      try {
        await source.queryRows('SELECT 1');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        t.ok(message.includes('missing-sql'), 'preserves source type in the reported error');
        throw error;
      }
    },
    /SQL adapter/,
    'reports missing adapter failures'
  );
  t.end();
});
