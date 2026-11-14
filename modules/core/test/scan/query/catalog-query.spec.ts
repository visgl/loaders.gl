// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch} from 'apache-arrow';
import {expect, expectTypeOf, test, vi} from 'vitest';
import {query, queryInBatches} from '@loaders.gl/core/scan';
import {createSQLCatalog, parseSQLQuery, parseSQLSelect} from '../../../src/scan/query';
import type {SQLCatalog, SQLCatalogQuery} from '../../../src/scan/query';
import {DataSource, createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import type {DataSourceOptions, TableMetadata} from '@loaders.gl/core/loader-utils';
import type {Schema} from '@loaders.gl/core/schema';

const schema: Schema = {
  fields: [
    {name: 'id', type: 'int32', nullable: false, metadata: {unit: 'identifier'}},
    {name: 'name', type: 'utf8', nullable: true}
  ],
  metadata: {title: 'Cities'}
};

/** Caller-owned source with deliberately forbidden row access. */
class MetadataSource extends DataSource<string, DataSourceOptions> {
  /** Observes caller ownership. */
  readonly close = vi.fn();
  /** Fails any accidental row access. */
  readonly read = vi.fn(() => {
    throw new Error('Row access is forbidden');
  });
  /** Exposes the portable table schema. */
  readonly getQueryMetadata = vi.fn(async () =>
    createScanQueryMetadata({
      sourceType: 'fixture',
      queryType: 'table',
      schema,
      execution: {status: 'supported', method: 'read'},
      capabilities: {}
    })
  );
  /** Registers a stable source name without I/O. */
  constructor(name = 'cities') {
    super('memory', {core: {name}});
  }
}

/** Names and schemas have separate observable discovery calls. */
class MetadataCollection extends DataSource<string, DataSourceOptions> {
  /** Observes caller ownership. */
  readonly close = vi.fn();
  /** Fails accidental child handle creation. */
  readonly getTable = vi.fn(() => {
    throw new Error('Child handles must not be opened');
  });
  /** Lists names without schemas to exercise lazy discovery. */
  readonly getTablesMetadata = vi.fn(
    async (): Promise<readonly TableMetadata[]> => [{name: 'cities'}]
  );
  /** Supplies the requested schema independently of listings. */
  readonly getTableMetadata = vi.fn(
    async (_name: string, _options?: {signal?: AbortSignal}): Promise<TableMetadata> => ({
      name: 'cities',
      schema
    })
  );
  /** Registers the named collection without I/O. */
  constructor(name = 'warehouse') {
    super('memory', {core: {name}});
  }
}

test.each([
  ['SHOW SOURCES;', {command: 'showSources'}],
  ['show tables', {command: 'showTables'}],
  ['SHOW TABLES FROM warehouse;', {command: 'showTables', from: 'warehouse'}],
  ['DESCRIBE cities;', {command: 'describe', from: 'cities'}],
  [
    'DESCRIBE warehouse.cities;',
    {command: 'describe', from: {source: 'warehouse', table: 'cities'}}
  ],
  [
    'DESCRIBE "warehouse.v2"."city""names";',
    {command: 'describe', from: {source: 'warehouse.v2', table: 'city"names'}}
  ]
])('parses catalog command %s', (sql, expected) => {
  expect(parseSQLQuery(sql)).toEqual(expected);
  expect(() => parseSQLSelect(sql)).toThrow();
});

test.each([
  'SHOW DATABASES',
  'SHOW SOURCES FROM warehouse',
  'SHOW TABLES FROM',
  'DESCRIBE',
  'DESCRIBE a.b.c',
  'DESCRIBE a WHERE id = 1',
  'SHOW SOURCES; SELECT *',
  'SHOW TABLES -- comment'
])('rejects unsupported catalog syntax %s', sql => {
  expect(() => parseSQLQuery(sql)).toThrow();
});

test('SHOW SOURCES is Arrow output and performs no metadata I/O', async () => {
  const source = new MetadataSource();
  const collection = new MetadataCollection();
  const complete = vi.fn();
  const result = await query('SHOW SOURCES;', {
    sources: [source, collection],
    sqlParser: Promise.resolve(parseSQLQuery),
    onQueryComplete: complete
  });
  expect(result).toHaveProperty('numRows');
  expect(result.toArray().map(row => row.toJSON())).toEqual([
    {source_name: 'cities'},
    {source_name: 'warehouse'}
  ]);
  expect(source.getQueryMetadata).not.toHaveBeenCalled();
  expect(collection.getTablesMetadata).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0].status).toBe('completed');
  expect(source.close).not.toHaveBeenCalled();
});

test('SHOW TABLES selects one source and returns usable quoted references', async () => {
  const source = new MetadataCollection('ware"house');
  source.getTablesMetadata.mockResolvedValue([
    {name: 'city.names'},
    {name: 'unsupported', queryable: false}
  ]);
  const unused = new MetadataSource();
  const result = await query(
    {command: 'showTables', from: source.name},
    {sources: [source, unused]}
  );
  expect(result.toArray().map(row => row.toJSON())).toEqual([
    {
      source_name: 'ware"house',
      table_name: 'city.names',
      table_reference: '"ware""house"."city.names"',
      queryable: true
    },
    {
      source_name: 'ware"house',
      table_name: 'unsupported',
      table_reference: '"ware""house"."unsupported"',
      queryable: false
    }
  ]);
  expect(source.getTableMetadata).not.toHaveBeenCalled();
  expect(source.getTable).not.toHaveBeenCalled();
  expect(unused.getQueryMetadata).not.toHaveBeenCalled();
});

test('catalog discovery is lazy and preserves structured references and schemas', async () => {
  const source = new MetadataCollection();
  const catalog = createSQLCatalog([source]);
  expectTypeOf(catalog).toEqualTypeOf<SQLCatalog>();
  expectTypeOf<SQLCatalogQuery>().toExtend<{command: string}>();
  expect(catalog.getSources()).toEqual([{name: 'warehouse'}]);
  expect(source.getTablesMetadata).not.toHaveBeenCalled();
  expect((await catalog.getTables('warehouse'))[0]).toMatchObject({
    reference: {source: 'warehouse', table: 'cities'},
    queryable: true
  });
  expect(await catalog.getSchema({source: 'warehouse', table: 'cities'})).toBe(schema);
  expect(source.getTableMetadata).toHaveBeenCalledWith('cities', {});
  expect(source.getTable).not.toHaveBeenCalled();
});

test('DESCRIBE returns ordered fields, logical Arrow types, nullability and metadata', async () => {
  const source = new MetadataCollection();
  const result = await query('DESCRIBE warehouse.cities;', {
    sources: [source],
    sqlParser: parseSQLQuery
  });
  expect(result.toArray().map(row => row.toJSON())).toEqual([
    {
      source_name: 'warehouse',
      table_name: 'cities',
      column_name: 'id',
      ordinal_position: 1,
      data_type: 'Int32',
      is_nullable: false,
      metadata: '{"unit":"identifier"}'
    },
    {
      source_name: 'warehouse',
      table_name: 'cities',
      column_name: 'name',
      ordinal_position: 2,
      data_type: 'Utf8',
      is_nullable: true,
      metadata: '{}'
    }
  ]);
  expect(source.getTablesMetadata).not.toHaveBeenCalled();
  expect(source.getTable).not.toHaveBeenCalled();
});

test('single-table sources appear with literal references and support DESCRIBE', async () => {
  const source = new MetadataSource('city.names');
  const tables = await query({command: 'showTables'}, {sources: [source]});
  expect(tables.getChild('table_reference')?.get(0)).toBe('"city.names"');
  expect(await createSQLCatalog([source]).getSchema('city.names')).toMatchObject(schema);
  expect(source.read).not.toHaveBeenCalled();
});

test.each([
  [{command: 'showSources'}, ['source_name']],
  [{command: 'showTables'}, ['source_name', 'table_name', 'table_reference', 'queryable']]
] as const)('empty %j retains its Arrow schema in both APIs', async (request, columns) => {
  const result = await query(request, {sources: []});
  const streamed: RecordBatch[] = [];
  for await (const batch of queryInBatches(request, {sources: []})) streamed.push(batch);
  expect(result.numRows).toBe(0);
  expect(result.schema.fields.map(field => field.name)).toEqual(columns);
  expect(streamed).toHaveLength(1);
  expect(streamed[0].schema).toEqual(result.schema);
});

test('empty table lists and zero-column schemas retain output fields', async () => {
  const source = new MetadataCollection();
  source.getTablesMetadata.mockResolvedValue([]);
  source.getTableMetadata.mockResolvedValue({name: 'empty', schema: {fields: [], metadata: {}}});
  expect((await query({command: 'showTables'}, {sources: [source]})).numRows).toBe(0);
  const described = await query(
    {command: 'describe', from: {source: 'warehouse', table: 'empty'}},
    {sources: [source]}
  );
  expect(described.numRows).toBe(0);
  expect(described.schema.fields.map(field => field.name)).toContain('is_nullable');
});

test('consumer return stops discovery before later sources and completes once', async () => {
  const first = new MetadataCollection('first');
  const second = new MetadataCollection('second');
  const complete = vi.fn();
  for await (const _batch of queryInBatches(
    {command: 'showTables'},
    {sources: [first, second], onQueryComplete: complete}
  ))
    break;
  expect(second.getTablesMetadata).not.toHaveBeenCalled();
  expect(first.close).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0].status).toBe('early-terminated');
});

test('cancellation before and during discovery propagates without closing sources', async () => {
  const source = new MetadataCollection();
  await expect(
    query({command: 'showTables'}, {sources: [source], signal: AbortSignal.abort()})
  ).rejects.toThrow();
  expect(source.getTablesMetadata).not.toHaveBeenCalled();
  const controller = new AbortController();
  source.getTablesMetadata.mockImplementation(async () => {
    controller.abort();
    return [{name: 'cities'}];
  });
  const complete = vi.fn();
  await expect(
    query(
      {command: 'showTables'},
      {sources: [source], signal: controller.signal, onQueryComplete: complete}
    )
  ).rejects.toThrow();
  expect(complete).toHaveBeenCalledTimes(1);
  expect(source.close).not.toHaveBeenCalled();
});

test('discovery errors preserve the failure and throwing observers cannot change results', async () => {
  const source = new MetadataCollection();
  const complete = vi.fn(() => {
    throw new Error('observer');
  });
  source.getTableMetadata.mockRejectedValue(new Error('discovery failed'));
  await expect(
    query(
      {command: 'describe', from: {source: 'warehouse', table: 'cities'}},
      {sources: [source], onQueryComplete: complete}
    )
  ).rejects.toThrow('discovery failed');
  expect(complete).toHaveBeenCalledTimes(1);
  expect(
    (await query({command: 'showSources'}, {sources: [source], onQueryComplete: complete})).numRows
  ).toBe(1);
});

test('validates registries, command shapes, discovery names and unavailable schemas', async () => {
  const source = new MetadataCollection();
  expect(() => createSQLCatalog([source, source])).toThrow('Duplicate');
  const catalog = createSQLCatalog([source]);
  await expect(catalog.getTables('missing')).rejects.toThrow('Unknown');
  await expect(catalog.getSchema('warehouse')).rejects.toThrow('qualified table reference');
  for (const request of [
    {command: 'showTables', from: ''},
    {command: 'describe'},
    {command: 'showSources', limit: 1},
    {command: 'unknown'}
  ]) {
    await expect(query(request as SQLCatalogQuery, {sources: [source]})).rejects.toThrow();
  }
  source.getTablesMetadata.mockResolvedValue([{name: 'x'}, {name: 'x'}]);
  await expect(catalog.getTables()).rejects.toThrow('unique');
  source.getTablesMetadata.mockResolvedValue(null as unknown as TableMetadata[]);
  await expect(catalog.getTables()).rejects.toThrow('array');
});

test('falls back to listed schemas without opening child handles', async () => {
  const source = new MetadataCollection();
  source.getTablesMetadata.mockResolvedValue([{name: 'cities', schema}]);
  Object.defineProperty(source, 'getTableMetadata', {value: undefined});
  expect(await createSQLCatalog([source]).getSchema({source: 'warehouse', table: 'cities'})).toBe(
    schema
  );
  expect(source.getTable).not.toHaveBeenCalled();
  await expect(
    createSQLCatalog([source]).getSchema({source: 'warehouse', table: 'missing'})
  ).rejects.toThrow('No discoverable');
});

test('catalog skips non-table sources and does not invent missing collection schemas', async () => {
  const nonTable = new MetadataSource('raster');
  const tableMetadata = await nonTable.getQueryMetadata();
  nonTable.getQueryMetadata.mockResolvedValue({
    ...tableMetadata,
    queryType: 'raster'
  } as unknown as typeof tableMetadata);
  const catalog = createSQLCatalog([nonTable]);
  expect(await catalog.getTables()).toEqual([]);
  await expect(catalog.getSchema('raster')).rejects.toThrow('No discoverable');
  const collection = new MetadataCollection();
  collection.getTableMetadata.mockResolvedValue({name: 'cities'});
  await expect(
    createSQLCatalog([collection]).getSchema({source: 'warehouse', table: 'cities'})
  ).rejects.toThrow('No discoverable');
});

test('metadata hooks receive cancellation and runtime metadata is validated', async () => {
  const source = new MetadataCollection();
  const signal = new AbortController().signal;
  const catalog = createSQLCatalog([source]);
  await catalog.getTables('warehouse', {signal});
  expect(source.getTablesMetadata).toHaveBeenCalledWith({signal});
  await catalog.getSchema({source: 'warehouse', table: 'cities'}, {signal});
  expect(source.getTableMetadata).toHaveBeenCalledWith('cities', {signal});
  source.getTablesMetadata.mockResolvedValue([
    {name: 'bad', queryable: 'yes'}
  ] as unknown as TableMetadata[]);
  await expect(catalog.getTables()).rejects.toThrow('boolean');
  await expect(catalog.getSchema(undefined as unknown as string)).rejects.toThrow('required');
  await expect(query({command: 'showSources'}, {} as never)).rejects.toThrow('sources array');
});

test('streamed and collected table listings agree across sources in registration order', async () => {
  const sources = [new MetadataCollection('first'), new MetadataCollection('second')];
  const request = {command: 'showTables'} as const;
  const collected = await query(request, {sources});
  const rows: Record<string, unknown>[] = [];
  for await (const batch of queryInBatches(request, {sources})) {
    expect(batch).toBeInstanceOf(RecordBatch);
    rows.push(...[...batch].map(row => row.toJSON()));
  }
  expect(rows).toEqual(collected.toArray().map(row => row.toJSON()));
  expect(rows.map(row => row.source_name)).toEqual(['first', 'second']);
});

test('DESCRIBE requires a named table for hybrid collection and default-table sources', async () => {
  const source = new MetadataCollection();
  const defaultMetadata = new MetadataSource().getQueryMetadata;
  Object.defineProperty(source, 'getQueryMetadata', {value: defaultMetadata});
  await expect(
    query({command: 'describe', from: 'warehouse'}, {sources: [source]})
  ).rejects.toThrow('qualified table reference');
  expect(defaultMetadata).not.toHaveBeenCalled();
  const result = await query(
    {command: 'describe', from: {source: 'warehouse', table: 'cities'}},
    {sources: [source]}
  );
  expect(result.getChild('table_name')?.toArray()).toEqual(['cities', 'cities']);
});
