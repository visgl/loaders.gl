// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {describe, expect, test} from 'vitest';
import {
  createScanQueryMetadata,
  DataSource,
  DataSourceManager,
  type DataSourceOptions,
  type ScanQueryMetadata,
  type TableScanReadOptions,
  type TableScanSource
} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, DataType, Schema} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {queryArrowTable, type SQLPredicate} from '@loaders.gl/sql';
import {FederatedTableScanSource, parseSQLPredicate} from '@loaders.gl/scan';

const TEST_CAPABILITIES = Object.freeze({
  predicate: 'residual' as const,
  projection: 'pushdown' as const,
  limit: 'pushdown' as const,
  streaming: true,
  cancellation: true
});

describe('FederatedTableScanSource', () => {
  test('validates constructor options and zero-limit reads', async () => {
    const dataSourceManager = new DataSourceManager();
    const physicalSource = new TestTableScanSource('physical', [makeArrowTable({id: [1]})]);
    dataSourceManager.add({dataSourceId: 'physical', dataSource: physicalSource});

    expect(() => new FederatedTableScanSource(dataSourceManager, {sources: []})).toThrow(
      'require at least one source'
    );
    expect(
      () =>
        new FederatedTableScanSource(dataSourceManager, {
          sources: [{dataSourceId: 'physical'}],
          schemaPolicy: 'invalid' as 'strict'
        })
    ).toThrow('Unsupported federated schema policy: invalid');
    expect(
      () =>
        new FederatedTableScanSource(dataSourceManager, {
          sources: [{dataSourceId: ''}]
        })
    ).toThrow('source ids must be non-empty');

    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'physical'}]
    });
    expect(await collectBatches(source.read({limit: 0}))).toEqual([]);
    expect(physicalSource.readCount).toBe(0);
  });

  test('resolves manager sources and appends ordered batches with global provenance', async () => {
    const dataSourceManager = new DataSourceManager();
    const firstSource = new TestTableScanSource('first', [
      makeArrowTable({stationId: [1, 2], score: [10, 20]})
    ]);
    const secondSource = new TestTableScanSource('second', [
      makeArrowTable({id: [3, 4], score: [30, 40]})
    ]);
    dataSourceManager.add({dataSourceId: 'first', dataSource: firstSource});
    dataSourceManager.add({dataSourceId: 'second', dataSource: secondSource});

    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [
        {
          dataSourceId: 'first',
          query: {
            predicate: parseSQLPredicate('score >= 20'),
            columns: ['stationId', 'score']
          },
          columnMapping: {stationId: 'id'}
        },
        {dataSourceId: 'second'}
      ]
    });
    const batches = await collectBatches(source.read({columns: ['id', 'score'], limit: 2}));

    expect(batches.map(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      [{id: 2, score: 20}],
      [{id: 3, score: 30}]
    ]);
    expect(batches.map(batch => batch.metadata)).toEqual([
      {sourceId: 'first', sourceIndex: 0, sourceBatchIndex: 0, sourceMetadata: {partition: 0}},
      {sourceId: 'second', sourceIndex: 1, sourceBatchIndex: 0, sourceMetadata: {partition: 0}}
    ]);
    expect(secondSource.readOptions[0]?.limit).toBe(1);
    expect(secondSource.readOptions[0]?.columns).toEqual(['id', 'score']);
  });

  test('unions first-seen columns, applies mappings, and null-fills missing values', async () => {
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.add({
      dataSourceId: 'cities',
      dataSource: new TestTableScanSource('cities', [makeArrowTable({id: [1], city: ['Oslo']})])
    });
    dataSourceManager.add({
      dataSourceId: 'stations',
      dataSource: new TestTableScanSource('stations', [
        makeArrowTable({stationId: [2], elevation: [20]})
      ])
    });
    const source = new FederatedTableScanSource(dataSourceManager, {
      schemaPolicy: 'union',
      sources: [
        {dataSourceId: 'cities'},
        {dataSourceId: 'stations', columnMapping: {stationId: 'id'}}
      ]
    });

    const metadata = await source.getQueryMetadata();
    expect(metadata.columns.map(column => [column.name, column.nullable])).toEqual([
      ['id', true],
      ['city', true],
      ['elevation', true]
    ]);
    expect(metadata.statistics?.rowCount).toBe(2);

    const batches = await collectBatches(
      source.read({
        predicate: parseSQLPredicate('city IS NULL'),
        columns: ['id', 'elevation']
      })
    );
    expect(batches.flatMap(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      {id: 2, elevation: 20}
    ]);
  });

  test('validates strict schemas, mapped fields, and compatible types', async () => {
    const missingManager = new DataSourceManager();
    missingManager.add({
      dataSourceId: 'a',
      dataSource: new TestTableScanSource('a', [makeArrowTable({id: [1], value: [2]})])
    });
    missingManager.add({
      dataSourceId: 'b',
      dataSource: new TestTableScanSource('b', [makeArrowTable({id: [2]})])
    });
    await expect(
      new FederatedTableScanSource(missingManager, {
        sources: [{dataSourceId: 'a'}, {dataSourceId: 'b'}]
      }).getQueryMetadata()
    ).rejects.toThrow(/strict schema mismatch.*missing \[value\]/);

    const typeManager = new DataSourceManager();
    typeManager.add({
      dataSourceId: 'numbers',
      dataSource: new TestTableScanSource('numbers', [makeArrowTable({id: [1]})])
    });
    typeManager.add({
      dataSourceId: 'strings',
      dataSource: new TestTableScanSource('strings', [makeArrowTable({id: ['1']})])
    });
    await expect(
      new FederatedTableScanSource(typeManager, {
        schemaPolicy: 'union',
        sources: [{dataSourceId: 'numbers'}, {dataSourceId: 'strings'}]
      }).getQueryMetadata()
    ).rejects.toThrow(/column type mismatch for id/);

    await expect(
      new FederatedTableScanSource(typeManager, {
        sources: [{dataSourceId: 'numbers', columnMapping: {missing: 'id'}}]
      }).getQueryMetadata()
    ).rejects.toThrow(/mapping source not found.*missing/);

    await expect(
      new FederatedTableScanSource(typeManager, {
        sources: [{dataSourceId: 'numbers', query: {columns: []}}]
      }).getQueryMetadata()
    ).rejects.toThrow(/projection must not be empty/);
    await expect(
      new FederatedTableScanSource(typeManager, {
        sources: [{dataSourceId: 'numbers', query: {columns: ['missing']}}]
      }).getQueryMetadata()
    ).rejects.toThrow(/source column not found.*missing/);
    await expect(
      new FederatedTableScanSource(typeManager, {
        sources: [{dataSourceId: 'numbers', columnMapping: {id: ''}}]
      }).getQueryMetadata()
    ).rejects.toThrow(/output column names must be non-empty/);

    const duplicateManager = new DataSourceManager();
    duplicateManager.add({
      dataSourceId: 'duplicate',
      dataSource: new TestTableScanSource('duplicate', [makeArrowTable({id: [1], alias: [2]})])
    });
    await expect(
      new FederatedTableScanSource(duplicateManager, {
        sources: [{dataSourceId: 'duplicate', columnMapping: {alias: 'id'}}]
      }).getQueryMetadata()
    ).rejects.toThrow(/duplicate output column.*id/);
  });

  test('resolves deferred sources and reports incompatible managed sources', async () => {
    const dataSourceManager = new DataSourceManager();
    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        sources: [{dataSourceId: 'missing'}]
      }).getQueryMetadata()
    ).rejects.toThrow('not registered: missing');

    const deferredSource = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'datasource://deferred'}]
    });
    const metadataPromise = deferredSource.getQueryMetadata();
    dataSourceManager.add({
      dataSourceId: 'deferred',
      dataSource: Promise.resolve(new TestTableScanSource('deferred', [makeArrowTable({id: [1]})]))
    });
    await expect(metadataPromise).resolves.toMatchObject({sourceType: 'federated-table'});

    dataSourceManager.add({
      dataSourceId: 'plain',
      dataSource: new DataSource('plain', {})
    });
    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        sources: [{dataSourceId: 'plain'}]
      }).getQueryMetadata()
    ).rejects.toThrow('does not implement TableScanSource: plain');

    const table = makeArrowTable({id: [1]});
    const supportedMetadata = createTestMetadata('compatible', table);
    dataSourceManager.add({
      dataSourceId: 'metadata-only',
      dataSource: new TestTableScanSource('metadata-only', [table], {
        metadata: {
          ...supportedMetadata,
          execution: {status: 'metadata-only', reason: 'Discovery only'}
        }
      })
    });
    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        sources: [{dataSourceId: 'metadata-only'}]
      }).getQueryMetadata()
    ).rejects.toThrow('does not support read(): metadata-only');

    dataSourceManager.add({
      dataSourceId: 'raster',
      dataSource: new TestTableScanSource('raster', [table], {
        metadata: {
          ...supportedMetadata,
          queryType: 'raster',
          execution: {status: 'supported', method: 'read'}
        } as ScanQueryMetadata
      })
    });
    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        sources: [{dataSourceId: 'raster'}]
      }).getQueryMetadata()
    ).rejects.toThrow('not a table source: raster');
  });

  test('stops later sources at the global limit and closes active iterators', async () => {
    const dataSourceManager = new DataSourceManager();
    const firstSource = new TestTableScanSource('first', [
      makeArrowTable({id: [1, 2]}),
      makeArrowTable({id: [3, 4]})
    ]);
    const secondSource = new TestTableScanSource('second', [makeArrowTable({id: [5]})]);
    dataSourceManager.add({dataSourceId: 'first', dataSource: firstSource});
    dataSourceManager.add({dataSourceId: 'second', dataSource: secondSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'first'}, {dataSourceId: 'second'}]
    });

    const batches = await collectBatches(source.read({limit: 1}));
    expect(batches.flatMap(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      {id: 1}
    ]);
    expect(firstSource.iteratorCloseCount).toBe(1);
    expect(secondSource.readCount).toBe(0);
  });

  test('skips empty batches and stops a child that ignores its pushed limit', async () => {
    const dataSourceManager = new DataSourceManager();
    const physicalSource = new TestTableScanSource(
      'physical',
      [makeArrowTable({id: [1]}), makeArrowTable({id: [2]})],
      {ignoreLimit: true, prependEmptyBatch: true}
    );
    dataSourceManager.add({dataSourceId: 'physical', dataSource: physicalSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'physical'}]
    });

    const batches = await collectBatches(source.read({limit: 1}));
    expect(batches.map(batch => batch.data.toArray()[0]?.toJSON())).toEqual([{id: 1}]);
    expect(physicalSource.iteratorCloseCount).toBe(1);
  });

  test('requests a row-count column when a union source lacks all global columns', async () => {
    const dataSourceManager = new DataSourceManager();
    const idTable = makeArrowTable({id: [1]});
    const valueTable = makeArrowTable({value: [2]});
    const idSource = new TestTableScanSource('ids', [idTable], {
      metadata: createTestMetadata('ids', idTable, {
        fields: [{name: 'id', type: 'int32', nullable: false}],
        metadata: {}
      })
    });
    const valueSource = new TestTableScanSource('values', [valueTable], {
      metadata: createTestMetadata('values', valueTable, {
        fields: [{name: 'value', type: 'int32', nullable: false}],
        metadata: {}
      })
    });
    dataSourceManager.add({dataSourceId: 'ids', dataSource: idSource});
    dataSourceManager.add({dataSourceId: 'values', dataSource: valueSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      schemaPolicy: 'union',
      sources: [{dataSourceId: 'ids'}, {dataSourceId: 'values'}]
    });

    const metadata = await source.getQueryMetadata();
    expect(metadata.columns.map(column => [column.name, column.type, column.nullable])).toEqual([
      ['id', 'int32', true],
      ['value', 'int32', true]
    ]);
    const batches = await collectBatches(
      source.read({predicate: parseSQLPredicate('value IS NOT NULL'), columns: ['value']})
    );
    expect(batches.flatMap(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      {value: 2}
    ]);
    expect(idSource.readOptions[0]?.columns).toEqual(['id']);
  });

  test('merges nullability and compares structured union type ids', async () => {
    const dataSourceManager = new DataSourceManager();
    const table = makeArrowTable({id: [1]});
    const nonNullableSchema: Schema = {
      fields: [{name: 'id', type: 'int32', nullable: false}],
      metadata: {}
    };
    const nullableSchema: Schema = {
      fields: [{name: 'id', type: 'int32', nullable: true, metadata: {unit: 'count'}}],
      metadata: {}
    };
    dataSourceManager.add({
      dataSourceId: 'required',
      dataSource: new TestTableScanSource('required', [table], {
        metadata: {
          ...createTestMetadata('required', table, nonNullableSchema),
          schema: nonNullableSchema
        }
      })
    });
    dataSourceManager.add({
      dataSourceId: 'nullable',
      dataSource: new TestTableScanSource('nullable', [table], {
        metadata: createTestMetadata('nullable', table, nullableSchema)
      })
    });
    const metadata = await new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'required'}, {dataSourceId: 'nullable'}]
    }).getQueryMetadata();
    expect(metadata.columns[0]?.nullable).toBe(true);

    const unionType: DataType = {
      type: 'sparse-union',
      typeIds: new Int32Array([3]),
      children: [{name: 'member', type: 'int32'}],
      typeIdToChildIndex: {3: 0}
    };
    const unionSchema: Schema = {
      fields: [{name: 'choice', type: unionType, nullable: false}],
      metadata: {}
    };
    const unionManager = new DataSourceManager();
    unionManager.add({
      dataSourceId: 'one',
      dataSource: new TestTableScanSource('one', [table], {
        metadata: createTestMetadata('one', table, unionSchema)
      })
    });
    unionManager.add({
      dataSourceId: 'two',
      dataSource: new TestTableScanSource('two', [table], {
        metadata: createTestMetadata('two', table, unionSchema)
      })
    });
    await expect(
      new FederatedTableScanSource(unionManager, {
        sources: [{dataSourceId: 'one'}, {dataSourceId: 'two'}]
      }).getQueryMetadata()
    ).resolves.toMatchObject({columns: [{name: 'choice'}]});
  });

  test('reports statistics only when every source count is exact', async () => {
    const table = makeArrowTable({id: [1]});
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.add({
      dataSourceId: 'big',
      dataSource: new TestTableScanSource('big', [table], {
        metadata: createTestMetadata('big', table, table.schema!, 2n)
      })
    });
    dataSourceManager.add({
      dataSourceId: 'small',
      dataSource: new TestTableScanSource('small', [table], {
        metadata: createTestMetadata('small', table, table.schema!, 1)
      })
    });
    const exactSource = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'big'}, {dataSourceId: 'small'}]
    });
    expect((await exactSource.getQueryMetadata()).statistics?.rowCount).toBe(3n);

    const filteredSource = new FederatedTableScanSource(dataSourceManager, {
      sources: [
        {dataSourceId: 'big', query: {predicate: parseSQLPredicate('id > 0')}},
        {dataSourceId: 'small'}
      ]
    });
    expect((await filteredSource.getQueryMetadata()).statistics).toBeUndefined();

    const limitedSource = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'big', query: {limit: 1}}, {dataSourceId: 'small'}]
    });
    expect((await limitedSource.getQueryMetadata()).statistics).toBeUndefined();

    const unknownMetadata = createTestMetadata('unknown', table);
    dataSourceManager.add({
      dataSourceId: 'unknown',
      dataSource: new TestTableScanSource('unknown', [table], {
        metadata: {...unknownMetadata, statistics: undefined}
      })
    });
    const unknownSource = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'unknown'}]
    });
    expect((await unknownSource.getQueryMetadata()).statistics).toBeUndefined();
  });

  test('releases manager subscriptions when a consumer returns early', async () => {
    const dataSourceManager = new DataSourceManager();
    const firstSource = new TestTableScanSource('first', [
      makeArrowTable({id: [1]}),
      makeArrowTable({id: [2]})
    ]);
    const secondSource = new TestTableScanSource('second', [makeArrowTable({id: [3]})]);
    dataSourceManager.add({dataSourceId: 'first', dataSource: firstSource, persistent: false});
    dataSourceManager.add({dataSourceId: 'second', dataSource: secondSource, persistent: false});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'first'}, {dataSourceId: 'second'}]
    });

    for await (const _batch of source.read()) break;
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(firstSource.iteratorCloseCount).toBe(1);
    expect(secondSource.readCount).toBe(0);
    expect(dataSourceManager.contains('first')).toBe(false);
    expect(dataSourceManager.contains('second')).toBe(false);
  });

  test('observes cancellation between physical batches', async () => {
    const dataSourceManager = new DataSourceManager();
    const physicalSource = new TestTableScanSource('physical', [
      makeArrowTable({id: [1]}),
      makeArrowTable({id: [2]})
    ]);
    dataSourceManager.add({dataSourceId: 'physical', dataSource: physicalSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'physical'}]
    });
    const controller = new AbortController();
    const iterator = source.read({signal: controller.signal})[Symbol.asyncIterator]();

    expect((await iterator.next()).value?.data.toArray()[0]?.toJSON()).toEqual({id: 1});
    controller.abort(new Error('cancel federated scan'));
    await expect(iterator.next()).rejects.toThrow('cancel federated scan');
    expect(physicalSource.iteratorCloseCount).toBe(1);
  });

  test('cancels deferred resolution and normalizes a missing abort reason', async () => {
    const dataSourceManager = new DataSourceManager();
    const pendingSource = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'datasource://pending'}]
    });
    const controller = new AbortController();
    const metadataPromise = pendingSource.getQueryMetadata({signal: controller.signal});
    dataSourceManager.add({
      dataSourceId: 'pending',
      dataSource: null,
      forceUpdate: true,
      persistent: false
    });
    controller.abort(new Error('cancel source resolution'));
    await expect(metadataPromise).rejects.toThrow('cancel source resolution');

    const missingReasonSignal = {
      aborted: true,
      reason: null
    } as AbortSignal;
    await expect(pendingSource.getQueryMetadata({signal: missingReasonSignal})).rejects.toThrow(
      'Request aborted'
    );
  });

  test('explains resolved source order and immutable column mappings', async () => {
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.add({
      dataSourceId: 'source',
      dataSource: new TestTableScanSource('source', [makeArrowTable({sourceId: [1], value: [2]})])
    });
    const mapping = {sourceId: 'id'};
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'source', columnMapping: mapping}]
    });
    mapping.sourceId = 'mutated';

    const explanation = await source.explain({columns: ['id'], limit: 1});
    expect(explanation.schemaPolicy).toBe('strict');
    expect(explanation.plan.map(step => step.kind)).toEqual(['scan', 'project', 'limit']);
    expect(explanation.sources).toEqual([
      {
        sourceId: 'source',
        sourceIndex: 0,
        sourceType: 'source',
        sourceColumns: ['sourceId', 'value'],
        outputColumns: ['id', 'value'],
        columnMapping: {sourceId: 'id'}
      }
    ]);
    expect(Object.isFrozen(source.sources[0].columnMapping)).toBe(true);
  });
});

/** Deterministic in-memory table source used by federation conformance tests. */
class TestTableScanSource
  extends DataSource<string, DataSourceOptions>
  implements TableScanSource<ArrowTableBatch, SQLPredicate>
{
  /** Source-local read options received by each operation. */
  readonly readOptions: TableScanReadOptions<SQLPredicate>[] = [];
  /** Number of physical read iterators opened. */
  readCount = 0;
  /** Number of physical iterators closed through completion or early return. */
  iteratorCloseCount = 0;

  private readonly tables: readonly ArrowTable[];
  private readonly testOptions: TestTableScanSourceOptions;

  /** Creates a deterministic source with one or more physical batches. */
  constructor(
    sourceType: string,
    tables: readonly ArrowTable[],
    testOptions: TestTableScanSourceOptions = {}
  ) {
    super(sourceType, {});
    this.tables = tables;
    this.testOptions = testOptions;
  }

  /** Reports the schema and exact row count without consuming a physical iterator. */
  async getQueryMetadata(): Promise<ScanQueryMetadata> {
    return (
      this.testOptions.metadata ||
      createTestMetadata(
        this.data,
        this.tables[0],
        this.tables[0].schema!,
        this.tables.reduce((sum, table) => sum + table.data.numRows, 0)
      )
    );
  }

  /** Applies the source-local query independently from the federated global query. */
  async *read(
    options: TableScanReadOptions<SQLPredicate> = {}
  ): AsyncIterableIterator<ArrowTableBatch> {
    this.readCount++;
    this.readOptions.push(options);
    let remaining = this.testOptions.ignoreLimit
      ? Number.POSITIVE_INFINITY
      : (options.limit ?? Number.POSITIVE_INFINITY);
    try {
      if (this.testOptions.prependEmptyBatch) {
        const data = arrow.tableFromArrays({id: []});
        yield {
          batchType: 'data',
          shape: 'arrow-table',
          schema: convertArrowToSchema(data.schema),
          data,
          length: 0,
          metadata: {partition: -1}
        };
      }
      for (let batchIndex = 0; batchIndex < this.tables.length && remaining > 0; batchIndex++) {
        if (options.signal?.aborted) throw options.signal.reason;
        const result = queryArrowTable(this.tables[batchIndex], {
          ...options,
          limit: this.testOptions.ignoreLimit
            ? undefined
            : Number.isFinite(remaining)
              ? remaining
              : undefined
        });
        if (!result.data.numRows) continue;
        remaining -= result.data.numRows;
        yield {
          batchType: 'data',
          shape: 'arrow-table',
          schema: result.schema,
          data: result.data,
          length: result.data.numRows,
          metadata: {partition: batchIndex}
        };
      }
    } finally {
      this.iteratorCloseCount++;
    }
  }
}

/** Test-only controls for deterministic physical source behavior. */
type TestTableScanSourceOptions = Readonly<{
  /** Overrides discovered metadata. */
  metadata?: ScanQueryMetadata;
  /** Simulates a source that accepts but ignores limit pushdown. */
  ignoreLimit?: boolean;
  /** Emits an empty physical batch before data batches. */
  prependEmptyBatch?: boolean;
}>;

/** Wraps simple columns in the loaders.gl Arrow table shape. */
function makeArrowTable(columns: Record<string, readonly unknown[]>): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

/** Creates supported table metadata with an optional schema and exact row count. */
function createTestMetadata(
  sourceType: string,
  table: ArrowTable,
  schema: Schema = table.schema!,
  rowCount: number | bigint = table.data.numRows
): ScanQueryMetadata {
  return createScanQueryMetadata({
    sourceType,
    queryType: 'table',
    execution: {status: 'supported', method: 'read'},
    schema,
    capabilities: {table: TEST_CAPABILITIES},
    statistics: {rowCount}
  });
}

/** Collects all federated batches without materializing them into one table. */
async function collectBatches(batches: AsyncIterable<ArrowTableBatch>): Promise<ArrowTableBatch[]> {
  const result: ArrowTableBatch[] = [];
  for await (const batch of batches) result.push(batch);
  return result;
}
