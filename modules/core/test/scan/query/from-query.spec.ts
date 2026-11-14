// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, expectTypeOf, test, vi} from 'vitest';
import {query, queryInBatches} from '@loaders.gl/core/scan';
import type {SQLQueryParser, Query} from '@loaders.gl/core/scan';
import {DataSource, createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import type {DataSourceOptions, TableSourceCollection} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';

/** Small caller-owned table source with an observable lifetime. */
class NamedTableSource extends DataSource<string, DataSourceOptions> {
  /** In-memory fixture values. */
  readonly table = new arrow.Table({value: arrow.vectorFromArray([1, 2, 3], new arrow.Int32())});
  /** Observes caller ownership. */
  readonly close = vi.fn();
  /** Counts actual metadata reads. */
  readonly metadataReads = vi.fn();
  /** Creates a source with a stable explicit name. */
  constructor(name: string) {
    super('memory.table', {core: {name}});
  }
  /** Exposes the concrete table schema. */
  async getQueryMetadata() {
    this.metadataReads();
    return createScanQueryMetadata({
      sourceType: 'test',
      queryType: 'table',
      schema: convertArrowToSchema(this.table.schema),
      execution: {status: 'supported', method: 'read'},
      capabilities: {}
    });
  }
  /** Streams one fixture batch. */
  async *read() {
    yield {
      shape: 'arrow-table' as const,
      data: this.table,
      schema: convertArrowToSchema(this.table.schema),
      length: 3,
      batchType: 'data' as const
    };
  }
}

/** Multi-table source whose table handles remain caller-owned. */
class CollectionSource
  extends DataSource<string, DataSourceOptions>
  implements TableSourceCollection
{
  /** Table owned by this collection. */
  readonly selected = new NamedTableSource('child');
  /** Observes qualified lookup without opening unrelated tables. */
  readonly getTable = vi.fn<TableSourceCollection['getTable']>(
    async (_name: string, _options?: {signal?: AbortSignal}) => this.selected
  );
  /** Creates a named collection without opening its tables. */
  constructor(name = 'warehouse') {
    super('memory.db', {core: {name}});
  }
}

test('FROM picks one named table source and leaves unused/default sources untouched', async () => {
  const cities = new NamedTableSource('cities');
  const unused = new NamedTableSource('unused');
  const complete = vi.fn();
  const result = await query(
    {
      from: 'cities',
      select: [{column: 'value', as: 'number'}],
      where: {op: '>', args: [{property: 'value'}, 1]},
      limit: 1
    },
    {source: unused, sources: [cities, unused], onQueryComplete: complete}
  );
  expect(result.toArray().map(row => row.number)).toEqual([2]);
  expect(unused.metadataReads).not.toHaveBeenCalled();
  expect(cities.close).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledTimes(1);
});

test('qualified FROM resolves only one loaded table with literal identifier components', async () => {
  const source = new CollectionSource('warehouse.v2');
  const controller = new AbortController();
  const result = await query(
    {from: {source: 'warehouse.v2', table: 'cities.v3'}},
    {sources: [source], signal: controller.signal}
  );
  expect(result.numRows).toBe(3);
  expect(source.getTable).toHaveBeenCalledWith('cities.v3', {signal: controller.signal});
  expect(source.selected.close).not.toHaveBeenCalled();
});

test('collections may return an already loaded Arrow table', async () => {
  const source = new CollectionSource();
  source.getTable.mockResolvedValueOnce({
    shape: 'arrow-table',
    data: source.selected.table,
    schema: convertArrowToSchema(source.selected.table.schema)
  });
  expect(
    (await query({from: {source: 'warehouse', table: 'cities'}}, {sources: [source]})).numRows
  ).toBe(3);
});

test('SQL parser promises are lazy and omission of FROM uses the normal source', async () => {
  const source = new NamedTableSource('cities');
  const parser = vi.fn<SQLQueryParser>(() => ({select: ['value'], limit: 1}));
  const sqlParser = Promise.resolve(parser);
  await query({}, {source, sqlParser});
  expect(parser).not.toHaveBeenCalled();
  const result = await query('SELECT value LIMIT 1', {source, sqlParser});
  expect(result.numRows).toBe(1);
  expect(parser).toHaveBeenCalledWith('SELECT value LIMIT 1');
  expect(source.close).not.toHaveBeenCalled();
});

test('async SQL parsing can select a qualified source and stream through the same pipeline', async () => {
  const source = new CollectionSource();
  const sqlParser: SQLQueryParser = async () => ({
    from: {source: 'warehouse', table: 'cities'},
    select: ['value'],
    limit: 2
  });
  const rows: number[] = [];
  for await (const batch of queryInBatches('SELECT value FROM warehouse.cities LIMIT 2', {
    sources: [source],
    sqlParser
  }))
    rows.push(...[...batch].map(row => row.value));
  expect(rows).toEqual([1, 2]);
});

test('missing parser, parser failures and invalid logical output report completion once', async () => {
  const source = new NamedTableSource('cities');
  for (const sqlParser of [
    undefined,
    () => {
      throw new Error('parser failed');
    },
    (() => ({orderBy: ['value']})) as unknown as SQLQueryParser
  ]) {
    const complete = vi.fn();
    await expect(
      query('SELECT value', {source, sqlParser, onQueryComplete: complete})
    ).rejects.toThrow();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0][0]).toMatchObject({status: 'failed'});
  }
});

test('unknown, duplicate and non-table sources fail without using the fallback', async () => {
  const fallback = new NamedTableSource('fallback');
  const table = new NamedTableSource('cities');
  const collection = new CollectionSource();
  for (const [request, sources] of [
    [{from: 'missing'}, [table]],
    [{from: 'cities'}, [table, new NamedTableSource('cities')]],
    [{from: 'warehouse'}, [collection]],
    [{from: {source: 'cities', table: 'missing'}}, [table]]
  ] as const) {
    await expect(query(request, {source: fallback, sources})).rejects.toThrow();
  }
  expect(fallback.metadataReads).not.toHaveBeenCalled();
});

test('missing FROM requires a normal source even when a registry was provided', async () => {
  await expect(query({}, {sources: [new NamedTableSource('cities')]})).rejects.toThrow(
    'Query source must'
  );
});

test('catalog failure and cancellation do not fall back or close caller-owned handles', async () => {
  const source = new CollectionSource();
  source.getTable.mockRejectedValueOnce(new Error('table failed'));
  const complete = vi.fn();
  await expect(
    query(
      {from: {source: 'warehouse', table: 'cities'}},
      {sources: [source], onQueryComplete: complete}
    )
  ).rejects.toThrow('table failed');
  expect(complete).toHaveBeenCalledTimes(1);
  const controller = new AbortController();
  source.getTable.mockImplementationOnce(async () => {
    controller.abort();
    return source.selected;
  });
  await expect(
    query(
      {from: {source: 'warehouse', table: 'cities'}},
      {sources: [source], signal: controller.signal}
    )
  ).rejects.toThrow();
  expect(source.selected.metadataReads).not.toHaveBeenCalled();
  expect(source.selected.close).not.toHaveBeenCalled();
});

test('public parser type accepts asynchronous logical queries', () => {
  expectTypeOf<SQLQueryParser>().returns.toEqualTypeOf<Query | Promise<Query>>();
});

test('literal dotted source names are not split and FROM requires an explicit registry', async () => {
  const source = new NamedTableSource('cities.v2');
  expect((await query({from: 'cities.v2', limit: 1}, {sources: [source]})).numRows).toBe(1);
  await expect(query({from: 'cities.v2'}, {source})).rejects.toThrow('sources array');
});

test('non-table collection results never open the default URL source', async () => {
  const source = new CollectionSource();
  source.getTable.mockResolvedValueOnce('https://invalid/table' as never);
  const fallback = new NamedTableSource('fallback');
  const createDataSource = vi.fn(() => fallback);
  const loader = {
    fromUrl: true,
    createDataSource,
    testURL: () => true
  } as unknown as import('@loaders.gl/core/loader-utils').SourceLoader;
  await expect(
    query(
      {from: {source: 'warehouse', table: 'invalid'}},
      {source: 'https://fallback/data', loaders: loader, sources: [source]}
    )
  ).rejects.toThrow('Arrow table or table scan source');
  expect(createDataSource).not.toHaveBeenCalled();
});

test('parser promise rejection and parser-time cancellation emit one completion before reading sources', async () => {
  const source = new NamedTableSource('cities');
  const complete = vi.fn();
  await expect(
    query('SELECT value', {
      source,
      sqlParser: Promise.reject(new Error('parser import failed')),
      onQueryComplete: complete
    })
  ).rejects.toThrow('parser import failed');
  expect(complete).toHaveBeenCalledTimes(1);
  const controller = new AbortController();
  const parser: SQLQueryParser = async () => {
    controller.abort();
    return {};
  };
  await expect(
    query('SELECT value', {source, sqlParser: parser, signal: controller.signal})
  ).rejects.toThrow();
  expect(source.metadataReads).not.toHaveBeenCalled();
});
