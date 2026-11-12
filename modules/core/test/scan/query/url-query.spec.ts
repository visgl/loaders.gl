// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, expectTypeOf, test, vi} from 'vitest';
import {query, queryInBatches} from '@loaders.gl/core/scan';
import type {ArrowTableBatch} from '@loaders.gl/core/schema';
import type {TableQueryExecutionSummary} from '@loaders.gl/core/loader-utils';
import type {QueryOptions} from '@loaders.gl/core/scan';
import {createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import type {
  SourceLoader,
  TableScanSource,
  LoaderOptions,
  CoreAPI
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';

/** Creates an instrumented URL source without network access or format dependencies. */
function makeURLSource() {
  const data = new arrow.Table({value: arrow.vectorFromArray([1, 2, 3], new arrow.Int32())});
  const schema = convertArrowToSchema(data.schema);
  const close = vi.fn(async () => {});
  const read = vi.fn(async function* () {
    yield {shape: 'arrow-table' as const, data, schema, length: 3, batchType: 'data' as const};
  });
  const source: TableScanSource & {close: typeof close} = {
    getQueryMetadata: vi.fn(async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema,
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      })
    ),
    read,
    close
  };
  const createDataSourceSync = vi.fn(
    (_url: string, _options: LoaderOptions, _coreApi?: CoreAPI) => source
  );
  const loader = {
    id: 'query-test',
    name: 'QueryTest',
    module: 'core',
    version: '1',
    extensions: ['query-test'],
    mimeTypes: [],
    type: 'query-test',
    fromUrl: true,
    fromBlob: false,
    options: {},
    defaultOptions: {},
    testURL: (url: string) => url.endsWith('.query-test'),
    createDataSourceSync
  } as unknown as SourceLoader;
  return {source, loader, close, read, createDataSourceSync};
}

test('URL sources open lazily with explicit loaders and close after one public completion', async () => {
  const fixture = makeURLSource();
  const complete = vi.fn();
  const fetch = vi.fn();
  const iterator = queryInBatches(
    {select: [{column: 'value', as: 'number'}], limit: 2},
    {
      source: 'data.query-test',
      loaders: fixture.loader,
      core: {fetch},
      customFormat: {enabled: true},
      onQueryComplete: complete
    }
  );
  expect(fixture.createDataSourceSync).not.toHaveBeenCalled();
  const batches: ArrowTableBatch[] = [];
  for await (const batch of iterator) batches.push(batch);
  expect(batches.flatMap(batch => batch.data.toArray().map(row => row.number))).toEqual([1, 2]);
  expect(fixture.createDataSourceSync).toHaveBeenCalledTimes(1);
  expect(fixture.createDataSourceSync.mock.calls[0].slice(0, 2)).toMatchObject([
    'data.query-test',
    {
      core: {fetch, ignoreRegisteredLoaders: true},
      customFormat: {enabled: true}
    }
  ]);
  expect(fixture.createDataSourceSync.mock.calls[0][1]).not.toHaveProperty('onQueryComplete');
  expect(fixture.createDataSourceSync.mock.calls[0][1]).not.toHaveProperty('source');
  expect(fixture.close).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0]).toMatchObject({
    rowsReturned: 2,
    earlyTerminationReason: 'limit'
  });
});

test('URL loader arrays select only explicit candidates', async () => {
  const fixture = makeURLSource();
  const other = makeURLSource();
  const otherLoader = {...other.loader, id: 'other', testURL: () => false};
  const result = await query(
    {},
    {source: 'data.query-test', loaders: [otherLoader, fixture.loader]}
  );
  expect(result.data.numRows).toBe(3);
  expect(other.createDataSourceSync).not.toHaveBeenCalled();
  expect(fixture.close).toHaveBeenCalledTimes(1);
});

test.each([
  undefined,
  [],
  [{}],
  [{fromUrl: false, createDataSourceSync() {}}]
])('invalid explicit URL loaders fail before source creation: %j', async loaders => {
  const complete = vi.fn();
  await expect(
    query({}, {
      source: 'data.query-test',
      loaders,
      onQueryComplete: complete
    } as unknown as QueryOptions)
  ).rejects.toThrow('explicit URL-capable source loaders');
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0]).toMatchObject({status: 'failed', sourcesRead: 0});
});

test('metadata failure closes query-owned sources and preserves the original failure', async () => {
  const fixture = makeURLSource();
  fixture.source.getQueryMetadata = async () => {
    throw new Error('metadata failed');
  };
  fixture.close.mockRejectedValueOnce(new Error('close failed'));
  const complete = vi.fn();
  await expect(
    query({}, {source: 'data.query-test', loaders: fixture.loader, onQueryComplete: complete})
  ).rejects.toThrow('metadata failed');
  expect(fixture.close).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0]).toMatchObject({
    status: 'failed',
    error: expect.objectContaining({message: 'metadata failed'})
  });
});

test('URL sources close on consumer return and cancellation; caller sources remain owned by callers', async () => {
  const fixture = makeURLSource();
  const complete = vi.fn();
  for await (const _batch of queryInBatches(
    {},
    {source: 'data.query-test', loaders: fixture.loader, onQueryComplete: complete}
  ))
    break;
  expect(fixture.close).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0]).toMatchObject({earlyTerminationReason: 'consumer-return'});
  const controller = new AbortController();
  const iterator = queryInBatches(
    {},
    {source: 'data.query-test', loaders: fixture.loader, signal: controller.signal}
  )[Symbol.asyncIterator]();
  await iterator.next();
  controller.abort();
  await expect(iterator.next()).rejects.toThrow();
  expect(fixture.close).toHaveBeenCalledTimes(2);
  await query({}, {source: fixture.source});
  expect(fixture.close).toHaveBeenCalledTimes(2);
});

test('pre-aborted URL queries never construct sources', async () => {
  const fixture = makeURLSource();
  const controller = new AbortController();
  controller.abort();
  await expect(
    query({}, {source: 'data.query-test', loaders: fixture.loader, signal: controller.signal})
  ).rejects.toThrow();
  expect(fixture.createDataSourceSync).not.toHaveBeenCalled();
});

test('async source preload receives the URL and cancellation prevents construction', async () => {
  const fixture = makeURLSource();
  const controller = new AbortController();
  const preload = vi.fn(async () => {
    controller.abort();
    return fixture.loader;
  });
  const loader = {...fixture.loader, preload};
  await expect(
    query({}, {source: 'data.query-test', loaders: loader, signal: controller.signal})
  ).rejects.toThrow();
  expect(preload).toHaveBeenCalledWith(
    'data.query-test',
    expect.objectContaining({signal: controller.signal})
  );
  expect(fixture.createDataSourceSync).not.toHaveBeenCalled();
  expect(fixture.close).not.toHaveBeenCalled();
});

test('source close errors fail once and throwing completion observers cannot hide them', async () => {
  const fixture = makeURLSource();
  fixture.close.mockRejectedValueOnce(new Error('close failed'));
  const complete = vi.fn((_summary: TableQueryExecutionSummary) => {
    throw new Error('observer failed');
  });
  await expect(
    query({}, {source: 'data.query-test', loaders: fixture.loader, onQueryComplete: complete})
  ).rejects.toThrow('close failed');
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0]).toMatchObject({status: 'failed'});
});

test('non-table URL sources fail validation and still close', async () => {
  const fixture = makeURLSource();
  delete (fixture.source as Partial<TableScanSource>).getQueryMetadata;
  await expect(query({}, {source: 'data.query-test', loaders: fixture.loader})).rejects.toThrow(
    'table scan source'
  );
  expect(fixture.close).toHaveBeenCalledTimes(1);
});

test('URL limit zero discovers metadata without reading and closes its source', async () => {
  const fixture = makeURLSource();
  const result = await query(
    {select: [{column: 'value', as: 'number'}], limit: 0},
    {source: 'data.query-test', loaders: fixture.loader}
  );
  expect(result.data.numRows).toBe(0);
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['number']);
  expect(fixture.read).not.toHaveBeenCalled();
  expect(fixture.close).toHaveBeenCalledTimes(1);
});

test('URL options require explicit source loaders in the public type', () => {
  expectTypeOf<QueryOptions>()
    .extract<{source: string}>()
    .toHaveProperty('loaders')
    .toEqualTypeOf<SourceLoader | SourceLoader[]>();
  expectTypeOf<{source: string}>().not.toExtend<QueryOptions>();
});

test('source preload failures report one public completion', async () => {
  const fixture = makeURLSource();
  const loader = {
    ...fixture.loader,
    preload: async () => {
      throw new Error('preload failed');
    }
  };
  const complete = vi.fn();
  await expect(
    query({}, {source: 'data.query-test', loaders: loader, onQueryComplete: complete})
  ).rejects.toThrow('preload failed');
  expect(fixture.createDataSourceSync).not.toHaveBeenCalled();
  expect(fixture.close).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0]).toMatchObject({status: 'failed', sourcesRead: 0});
});
