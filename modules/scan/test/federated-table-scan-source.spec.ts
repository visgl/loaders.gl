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
  type ScanExecutionTelemetry,
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

  test('executes unsupported source predicates residually before source-local limits', async () => {
    const dataSourceManager = new DataSourceManager();
    const filteredTable = makeArrowTable({id: [1], score: [10]});
    const selectedTable = makeArrowTable({id: [2], score: [20]});
    const finalTable = makeArrowTable({id: [3], score: [30]});
    const metadata = createTestMetadata('arrow-ipc', filteredTable, filteredTable.schema!, 3);
    const physicalSource = new TestTableScanSource(
      'arrow-ipc',
      [filteredTable, selectedTable, finalTable],
      {
        ignoreLimit: true,
        metadata: {
          ...metadata,
          capabilities: {
            table: {...TEST_CAPABILITIES, predicate: 'unsupported'}
          }
        }
      }
    );
    dataSourceManager.add({dataSourceId: 'arrow-ipc', dataSource: physicalSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [
        {
          dataSourceId: 'arrow-ipc',
          query: {
            predicate: parseSQLPredicate('score >= 20'),
            columns: ['id'],
            limit: 1
          }
        }
      ]
    });

    const batches = await collectBatches(source.read());
    expect(batches.flatMap(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      {id: 2}
    ]);
    expect(physicalSource.readOptions[0]).toMatchObject({
      columns: ['id', 'score'],
      predicate: undefined,
      limit: undefined
    });
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

  test('normalizes only explicitly declared lossless schema conversions', async () => {
    const dataSourceManager = new DataSourceManager();
    const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
    const compactTable = makeTypedArrowTable({
      id: arrow.vectorFromArray([1], new arrow.Int32()),
      category: arrow.vectorFromArray(['compact'], dictionaryType)
    });
    const floatingTable = makeTypedArrowTable({
      id: arrow.vectorFromArray([2], new arrow.Float32()),
      category: arrow.vectorFromArray(['floating'], new arrow.Utf8())
    });
    dataSourceManager.add({
      dataSourceId: 'compact',
      dataSource: new TestTableScanSource('compact', [compactTable])
    });
    dataSourceManager.add({
      dataSourceId: 'floating',
      dataSource: new TestTableScanSource('floating', [floatingTable])
    });
    const outputSchema: Schema = {
      fields: [
        {name: 'category', type: 'utf8', nullable: true},
        {name: 'id', type: 'float64', nullable: true}
      ],
      metadata: {contract: 'measurement-v1'}
    };
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'compact'}, {dataSourceId: 'floating'}],
      outputSchema
    });

    const metadata = await source.getQueryMetadata();
    expect(metadata.schema).toMatchObject(outputSchema);
    const batches = await collectBatches(source.read());
    expect(batches.flatMap(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      {category: 'compact', id: 1},
      {category: 'floating', id: 2}
    ]);
    const explanation = await source.explain();
    expect(explanation.sources.map(child => child.normalizedTypes)).toEqual([
      {id: 'float64', category: 'utf8'},
      {id: 'float64'}
    ]);

    const lossyManager = new DataSourceManager();
    const largeIntegerTable = makeTypedArrowTable({
      id: arrow.vectorFromArray([1n], new arrow.Int64())
    });
    lossyManager.add({
      dataSourceId: 'large-integer',
      dataSource: new TestTableScanSource('large-integer', [largeIntegerTable])
    });
    await expect(
      new FederatedTableScanSource(lossyManager, {
        sources: [{dataSourceId: 'large-integer'}],
        outputSchema: {
          fields: [{name: 'id', type: 'float64', nullable: true}],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/Unsupported federated normalization.*int64 to float64/);
  });

  test('validates declared output fields and nullability', async () => {
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.add({
      dataSourceId: 'source',
      dataSource: new TestTableScanSource('source', [makeArrowTable({id: [1], value: [2]})])
    });
    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        sources: [{dataSourceId: 'source'}],
        outputSchema: {fields: [{name: 'id', type: 'float64', nullable: true}], metadata: {}}
      }).getQueryMetadata()
    ).rejects.toThrow(/output schema mismatch: missing \[value\]/);
    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        sources: [{dataSourceId: 'source'}],
        outputSchema: {
          fields: [
            {name: 'id', type: 'float64', nullable: false},
            {name: 'value', type: 'float64', nullable: true}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/cannot remove nullability for id/);
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

    const table = makeTypedArrowTable({id: arrow.vectorFromArray([1], new arrow.Int32())});
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

  test('reports serializable aggregate and per-source execution telemetry', async () => {
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.add({
      dataSourceId: 'first',
      dataSource: new TestTableScanSource('first', [makeArrowTable({id: [1, 2], score: [10, 20]})])
    });
    dataSourceManager.add({
      dataSourceId: 'second',
      dataSource: new TestTableScanSource('second', [makeArrowTable({id: [3], score: [30]})])
    });
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'first'}, {dataSourceId: 'second'}]
    });
    let telemetry: ScanExecutionTelemetry | undefined;
    await collectBatches(
      source.read({
        predicate: parseSQLPredicate('score >= 20'),
        limit: 1,
        onTelemetry: value => {
          telemetry = value;
        }
      })
    );

    expect(telemetry).toMatchObject({
      status: 'early-terminated',
      earlyTerminationReason: 'limit',
      sourcesPlanned: 2,
      sourcesRead: 1,
      batchesRead: 1,
      rowsRead: 2,
      rowsTested: 2,
      rowsRetained: 1,
      rowsReturned: 1,
      sources: [
        {
          sourceId: 'first',
          sourceType: 'first',
          sourceIndex: 0,
          status: 'completed',
          batchesDecoded: 1,
          rowsRead: 2,
          rowsReturned: 1
        }
      ]
    });
    expect(() => JSON.stringify(telemetry)).not.toThrow();
    const explanation = await source.explain({limit: 1});
    expect(() => JSON.stringify(explanation)).not.toThrow();
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

  test('handles non-data batches and physical batches without schemas', async () => {
    const dataSourceManager = new DataSourceManager();
    const physicalSource = new TestTableScanSource('physical', [makeArrowTable({id: [1]})], {
      prependNonDataBatch: true,
      omitBatchSchema: true
    });
    dataSourceManager.add({dataSourceId: 'physical', dataSource: physicalSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'physical'}]
    });

    const batches = await collectBatches(source.read());
    expect(batches.flatMap(batch => batch.data.toArray().map(row => row?.toJSON()))).toEqual([
      {id: 1}
    ]);
  });

  test('reports failed child scans through aggregate telemetry', async () => {
    const dataSourceManager = new DataSourceManager();
    const physicalSource = new TestTableScanSource('broken', [makeArrowTable({id: [1]})], {
      throwError: new Error('broken child')
    });
    dataSourceManager.add({dataSourceId: 'broken', dataSource: physicalSource});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'broken'}]
    });
    let telemetry: ScanExecutionTelemetry | undefined;
    await expect(
      collectBatches(source.read({onTelemetry: value => (telemetry = value)}))
    ).rejects.toThrow('broken child');
    expect(telemetry).toMatchObject({status: 'failed', sources: [{status: 'failed'}]});
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

    const firstDecimal = {type: 'decimal', bitWidth: 128, precision: 10, scale: 2} as const;
    const secondDecimal = {
      scale: 2,
      precision: 10,
      bitWidth: 128,
      type: 'decimal'
    } as const;
    const decimalManager = new DataSourceManager();
    decimalManager.add({
      dataSourceId: 'first-decimal',
      dataSource: new TestTableScanSource('first-decimal', [table], {
        metadata: createTestMetadata('first-decimal', table, {
          fields: [{name: 'amount', type: firstDecimal, nullable: false}],
          metadata: {}
        })
      })
    });
    decimalManager.add({
      dataSourceId: 'second-decimal',
      dataSource: new TestTableScanSource('second-decimal', [table], {
        metadata: createTestMetadata('second-decimal', table, {
          fields: [{name: 'amount', type: secondDecimal, nullable: false}],
          metadata: {}
        })
      })
    });
    await expect(
      new FederatedTableScanSource(decimalManager, {
        sources: [{dataSourceId: 'first-decimal'}, {dataSourceId: 'second-decimal'}]
      }).getQueryMetadata()
    ).resolves.toMatchObject({columns: [{name: 'amount'}]});
  });

  test('validates explicit nullable union fields and lossless primitive casts', async () => {
    const table = makeTypedArrowTable({id: arrow.vectorFromArray([1], new arrow.Int32())});
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.add({
      dataSourceId: 'present',
      dataSource: new TestTableScanSource('present', [table], {
        metadata: createTestMetadata('present', table, {
          fields: [{name: 'id', type: 'int32', nullable: false}],
          metadata: {}
        })
      })
    });
    dataSourceManager.add({
      dataSourceId: 'missing',
      dataSource: new TestTableScanSource('missing', [table], {
        metadata: createTestMetadata('missing', table, {
          fields: [{name: 'other', type: 'int32', nullable: false}],
          metadata: {}
        })
      })
    });

    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        schemaPolicy: 'union',
        sources: [{dataSourceId: 'present'}, {dataSourceId: 'missing'}],
        outputSchema: {
          fields: [
            {name: 'id', type: 'int64', nullable: true},
            {name: 'other', type: 'int32', nullable: true},
            {name: 'extra', type: 'utf8', nullable: true}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).resolves.toMatchObject({columns: [{name: 'id'}, {name: 'other'}, {name: 'extra'}]});

    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        schemaPolicy: 'union',
        sources: [{dataSourceId: 'present'}, {dataSourceId: 'missing'}],
        outputSchema: {
          fields: [
            {name: 'id', type: 'int64', nullable: true},
            {name: 'other', type: 'int32', nullable: true},
            {name: 'extra', type: 'utf8', nullable: false}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/absent from every source and must be nullable/);

    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        schemaPolicy: 'union',
        sources: [{dataSourceId: 'present'}, {dataSourceId: 'missing'}],
        outputSchema: {
          fields: [
            {name: 'id', type: 'int32', nullable: false},
            {name: 'other', type: 'int32', nullable: true}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/must be nullable when absent/);

    await expect(
      new FederatedTableScanSource(dataSourceManager, {
        schemaPolicy: 'union',
        sources: [{dataSourceId: 'present'}],
        outputSchema: {
          fields: [
            {name: 'id', type: 'int32', nullable: true},
            {name: 'id', type: 'int64', nullable: true}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/invalid or duplicate field/);

    const viewManager = new DataSourceManager();
    const viewSchema: Schema = {
      fields: [
        {name: 'text', type: 'utf8-view' as DataType, nullable: false},
        {name: 'payload', type: 'binary-view' as DataType, nullable: false},
        {name: 'unsigned', type: 'uint8', nullable: false},
        {name: 'signed', type: 'int32', nullable: false}
      ],
      metadata: {}
    };
    viewManager.add({
      dataSourceId: 'views',
      dataSource: new TestTableScanSource('views', [table], {
        metadata: createTestMetadata('views', table, viewSchema)
      })
    });
    await expect(
      new FederatedTableScanSource(viewManager, {
        sources: [{dataSourceId: 'views'}],
        outputSchema: {
          fields: [
            {name: 'text', type: 'utf8', nullable: true},
            {name: 'payload', type: 'binary', nullable: true},
            {name: 'unsigned', type: 'int16', nullable: true},
            {name: 'signed', type: 'int8', nullable: true}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/Unsupported federated normalization.*int32 to int8/);

    await expect(
      new FederatedTableScanSource(viewManager, {
        sources: [{dataSourceId: 'views'}],
        outputSchema: {
          fields: [
            {name: 'text', type: 'int32', nullable: true},
            {name: 'payload', type: 'binary', nullable: true},
            {name: 'unsigned', type: 'int16', nullable: true},
            {name: 'signed', type: 'int64', nullable: true}
          ],
          metadata: {}
        }
      }).getQueryMetadata()
    ).rejects.toThrow(/Unsupported federated normalization.*utf8-view to int32/);
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

  test('ignores superseded asynchronous source resolutions and reports current failures', async () => {
    const dataSourceManager = new DataSourceManager();
    let resolveFirst!: (source: TestTableScanSource) => void;
    let rejectSecond!: (error: Error) => void;
    let resolveThird!: (source: TestTableScanSource) => void;
    const firstPromise = new Promise<TestTableScanSource>(resolve => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<TestTableScanSource>((_resolve, reject) => {
      rejectSecond = reject;
    });
    const thirdPromise = new Promise<TestTableScanSource>(resolve => {
      resolveThird = resolve;
    });
    dataSourceManager.add({dataSourceId: 'replaceable', dataSource: firstPromise});
    const source = new FederatedTableScanSource(dataSourceManager, {
      sources: [{dataSourceId: 'replaceable'}]
    });
    const metadataPromise = source.getQueryMetadata();
    await Promise.resolve();
    dataSourceManager.add({dataSourceId: 'replaceable', dataSource: secondPromise});
    dataSourceManager.add({dataSourceId: 'replaceable', dataSource: thirdPromise});
    resolveFirst(new TestTableScanSource('stale', [makeArrowTable({stale: [1]})]));
    rejectSecond(new Error('superseded failure'));
    resolveThird(new TestTableScanSource('current', [makeArrowTable({current: [2]})]));
    await expect(metadataPromise).resolves.toMatchObject({columns: [{name: 'current'}]});

    const failedManager = new DataSourceManager();
    const failedSource = new FederatedTableScanSource(failedManager, {
      sources: [{dataSourceId: 'datasource://failed'}]
    });
    const failedMetadata = failedSource.getQueryMetadata();
    failedManager.add({
      dataSourceId: 'failed',
      dataSource: Promise.reject(new Error('managed source failed')),
      persistent: false
    });
    await expect(failedMetadata).rejects.toThrow('managed source failed');
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
        columnMapping: {sourceId: 'id'},
        normalizedTypes: {}
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
      if (this.testOptions.throwError) throw this.testOptions.throwError;
      if (this.testOptions.prependNonDataBatch) {
        yield {
          batchType: 'metadata',
          shape: 'arrow-table',
          length: 0,
          metadata: {partition: -2}
        } as unknown as ArrowTableBatch;
      }
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
          ...(this.testOptions.omitBatchSchema ? {} : {schema: result.schema}),
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
  /** Emits a non-data batch before data batches. */
  prependNonDataBatch?: boolean;
  /** Omits the schema on data batches to exercise metadata fallback. */
  omitBatchSchema?: boolean;
  /** Throws from the physical iterator before producing a batch. */
  throwError?: Error;
}>;

/** Wraps simple columns in the loaders.gl Arrow table shape. */
function makeArrowTable(columns: Record<string, readonly unknown[]>): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

/** Wraps pre-typed Arrow vectors without allowing Arrow to infer wider scalar types. */
function makeTypedArrowTable(columns: Record<string, arrow.Vector>): ArrowTable {
  const data = new arrow.Table(columns);
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
