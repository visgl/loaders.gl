// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {hydrateArrowTable} from '@loaders.gl/arrow';
import {createDataSource, encode, fetchFile, isBrowser, load} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetBatch,
  ParquetJSWriter,
  ParquetSourceLoader,
  type ParquetSourceLoaderOptions,
  type ParquetSourceMetadata,
  type ParquetTelemetryEvent
} from '@loaders.gl/parquet';
import {
  ParquetSource,
  ParquetSourceLoader as ParquetSourceLoaderWithParser
} from '@loaders.gl/parquet/parquet-source-loader';

import {getSchemaFromParquetReader} from '../src/lib/parsers/get-parquet-schema';
import {decodeParquetSourceWorkerInput} from '../src/lib/parquet-source-worker-decoder';
import type {ParquetSourceWorkerInput} from '../src/lib/parquet-source-worker-types';
import {ParquetRangeFile} from '../src/lib/sources/parquet-range-file';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';

const FIXTURE_URL = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
const STATISTICS_FIXTURE_URL =
  '@loaders.gl/parquet/test/data/apache/good/nullable.impala.parquet';
const REMOTE_URL = 'https://example.com/data/alltypes_plain.parquet';

/** Lazily encoded three-row-group fixture shared by selective-read tests. */
let selectiveFixturePromise: Promise<ArrayBuffer> | null = null;

type RangeRequestRecord = {
  /** Requested URL. */
  url: string;
  /** HTTP request headers. */
  headers: Headers;
  /** Inclusive first requested byte. */
  start: number;
  /** Inclusive last requested byte. */
  end: number;
};

type RangeRequestInterceptor = (
  /** Parsed request record. */
  request: RangeRequestRecord,
  /** Original fetch options, including the abort signal. */
  requestOptions: RequestInit
) => Promise<Response> | null;

type RangeFetchOptions = {
  /** ETag returned by each request, based on its zero-based request index. */
  getEtag?: (requestIndex: number) => string;
  /** Request log populated by the mock fetch implementation. */
  requests?: RangeRequestRecord[];
  /** Optional response override used by cancellation and error tests. */
  intercept?: RangeRequestInterceptor;
};

test('ParquetSourceLoader#Blob metadata and schema are cached', async () => {
  const fixture = await loadFixture();
  const source = (await load(new Blob([fixture]), ParquetSourceLoader)) as ParquetSource;

  expect(source instanceof ParquetSource).toBeTruthy();
  expect(source.capabilities).toBe(PARQUET_SOURCE_CAPABILITIES);
  expect(Object.isFrozen(source.getTelemetry())).toBeTruthy();
  const metadata = await source.getMetadata();
  const schema = await source.getSchema();

  expect(metadata.rowCount > 0).toBeTruthy();
  expect(metadata.rowGroupCount).toBe(metadata.rowGroups.length);
  expect(metadata.fileByteLength).toBe(fixture.byteLength);
  expect(metadata.schema).toBe(schema);
  expect(metadata.version).toBe(metadata.formatVersion);
  expect(metadata.rowGroups[0].columns.length > 0).toBeTruthy();
  expect(metadata.rowGroups[0].rowOffset).toBe(0);
  expect(metadata.rowGroups[0].compressedSize).toBe(metadata.rowGroups[0].compressedByteLength);
  expect(metadata.rowGroups[0].columns[0].fileOffset >= 4).toBeTruthy();
  expect(schema.fields.length > 0).toBeTruthy();
  expect(await source.getMetadata()).toBe(metadata);
  expect(await source.getSchema()).toBe(schema);
  expect(Object.isFrozen(metadata)).toBeTruthy();
  expect(Object.isFrozen(metadata.schema)).toBeTruthy();
  expect(Object.isFrozen(metadata.schema.fields)).toBeTruthy();
  expect(Object.isFrozen(metadata.schema.fields[0])).toBeTruthy();
  expect(Object.isFrozen(metadata.rowGroups)).toBeTruthy();
  expect(Object.isFrozen(metadata.rowGroups[0].columns)).toBeTruthy();

  const formatMetadata = await source.getMetadata({formatSpecificMetadata: true});
  expect(formatMetadata.formatSpecificMetadata).toBeTruthy();
  await source.close();
  await source.close();
  await expect(source.getMetadata()).rejects.toThrow(/ParquetSource is closed/);
  });

test('ParquetSource#getQueryMetadata exposes panel-ready schema and statistics', async () => {
  const fixture = await loadFixture();
  const source = (await load(new Blob([fixture]), ParquetSourceLoader)) as ParquetSource;
  const metadata = await source.getQueryMetadata();

  expect(metadata.sourceType).toBe('parquet');
  expect(metadata.queryType).toBe('table');
  expect(metadata.columns.length > 0).toBeTruthy();
  expect(metadata.capabilities.table?.projection).toBe('pushdown');
  expect(Number(metadata.statistics?.rowCount) > 0).toBeTruthy();
  await source.close();
});

test('ParquetSource#preserves opaque WASM inputs by identity', async () => {
  const wasmUrl = Promise.resolve(new URL('https://example.com/parquet_wasm_bg.wasm'));
  const source = new ParquetSource(new Blob(), {parquet: {wasmUrl}});

  expect(source.options.parquet.wasmUrl).toBe(wasmUrl);

  await source.close();
  });

test('ParquetSource#routes the public worker URL to the selective worker descriptor', async () => {
  const workerUrl = 'https://example.com/parquet-source-worker.js';
  const source = new ParquetSource(new Blob(), {parquet: {workerUrl}});
  const signal = new AbortController().signal;
  const workerOptions = (
    source as unknown as {
      getWorkerOptions: (
        concurrency: number,
        signal: AbortSignal
      ) => {'parquet-source'?: {workerUrl?: string}; parquet?: {signal?: AbortSignal}};
    }
  ).getWorkerOptions(1, signal);

  expect(workerOptions['parquet-source']?.workerUrl).toBe(workerUrl);
  expect(workerOptions.parquet?.signal).toBe(signal);

  await source.close();
  });

test('ParquetSource#read applies snapshotted source defaults', async () => {
  const fixture = await createSelectiveFixture();
  const rowGroups = [1];
  const columns = ['x'];
  const source = createRemoteSource(createRangeFetch(fixture), {
    parquet: {rowGroups, columns, batchSize: 1, concurrency: 2}
  });
  const iterator = source.read()[Symbol.asyncIterator]();
  const firstBatch = await iterator.next();
  rowGroups[0] = 2;
  columns[0] = 'y';
  const remainingBatches = await collectParquetBatches({
    [Symbol.asyncIterator]: () => iterator
  });
  const batches = firstBatch.value ? [firstBatch.value, ...remainingBatches] : remainingBatches;

  expect(batches.map(batch => batch.rowGroupIndex)).toEqual([1, 1]);
  expect(batches.every(batch => batch.schema?.fields[0]?.name === 'x')).toBeTruthy();
  await source.close();
  });

test('ParquetSourceLoader#decodes optional column-chunk statistics', async () => {
  const fixture = await loadFixture(STATISTICS_FIXTURE_URL);
  const source = createDataSource(new Blob([fixture]), [ParquetSourceLoaderWithParser], {
    core: {type: 'parquet'}
  }) as ParquetSource;
  const metadata = await source.getMetadata();
  const columns = metadata.rowGroups[0].columns;
  const idStatistics = columns.find(column => column.path.join('.') === 'id')?.statistics;
  const keyStatistics = columns.find(
    column => column.path.join('.') === 'int_map.map.key'
  )?.statistics;

  expect(idStatistics?.min).toBe(1n);
  expect(idStatistics?.max).toBe(7n);
  expect(idStatistics?.nullCount).toBe(0);
  expect(keyStatistics?.min).toBe('k1');
  expect(keyStatistics?.max).toBe('k3');
  await source.close();
  });

test('ParquetSource#getScanPlan shares logical and physical pruning decisions', async () => {
  const fixture = await createSelectiveFixture();
  const source = createRemoteSource(createRangeFetch(fixture));
  const plan = await source.getScanPlan({
    columns: ['source_id'],
    predicate: {op: '=', args: [{property: 'x'}, 2]},
    rowGroupFilter: rowGroup => rowGroup.index === 1,
    limit: 1
  });

  expect(plan.outputColumns).toEqual(['source_id']);
  expect(plan.requiredColumns).toEqual(['x', 'source_id']);
  expect(plan.rowGroups.indices).toEqual([1]);
  expect(plan.rowGroups.requested).toBe(3);
  expect(plan.rowGroups.selected).toBe(1);
  expect(plan.rowGroups.prunedByCallback).toBe(2);
  expect(plan.rowGroups.prunedByStatistics).toBe(0);
  expect(plan.rowGroups.prunedByBloomFilter).toBe(0);
  expect(plan.plan.at(-1)?.kind).toBe('limit');
  expect(Object.isFrozen(plan.rowGroups.indices)).toBeTruthy();
  expect(plan.pages.plans.map(pagePlan => ({phase: pagePlan.phase, columns: pagePlan.columns}))).toEqual([
      {phase: 'predicate', columns: [['x']]},
      {phase: 'projection', columns: [['source_id']]}
    ]);

  await source.close();
  });

test('ParquetJSWriter emits opt-in Bloom filters consumed by source planning', async () => {
  const parquetBuffer = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [{name: 'id', type: 'utf8', nullable: false}],
        metadata: {}
      },
      data: [{id: 'a'}, {id: 'z'}, {id: 'a'}, {id: 'z'}]
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {worker: false, parquet: {rowGroupSize: 2, bloomFilter: {id: true}}}
  );
  const source = createDataSource(new Blob([parquetBuffer]), [ParquetSourceLoaderWithParser], {
    core: {type: 'parquet'}
  }) as ParquetSource;
  const metadata = await source.getMetadata();
  const idColumns = metadata.rowGroups.map(rowGroup => rowGroup.columns[0]);
  expect(idColumns.every(column => column.bloomFilterOffset !== undefined)).toBeTruthy();
  expect(idColumns.every(column => (column.bloomFilterByteLength || 0) > 0)).toBeTruthy();
  const plan = await source.getScanPlan({predicate: {op: '=', args: [{property: 'id'}, 'm']}});
  expect(plan.bloomFilters.read).toBe(2);
  expect(plan.rowGroups.prunedByBloomFilter).toBe(2);
  await source.close();
  });

test('ParquetJSWriter emits page indexes consumed by selective page planning', async () => {
  const parquetBuffer = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'x', type: 'int32', nullable: false},
          {name: 'payload', type: 'utf8', nullable: false}
        ],
        metadata: {}
      },
      data: [
        {x: 0, payload: 'zero'},
        {x: 1, payload: 'one'},
        {x: 100, payload: 'hundred'},
        {x: 101, payload: 'hundred-one'}
      ]
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {worker: false, parquet: {pageSize: 2, pageIndex: {x: true}}}
  );
  const source = createDataSource(new Blob([parquetBuffer]), [ParquetSourceLoaderWithParser], {
    core: {type: 'parquet'}
  }) as ParquetSource;
  const metadata = await source.getMetadata();
  const xColumn = metadata.rowGroups[0].columns.find(column => column.path.join('.') === 'x');
  expect(xColumn?.columnIndexOffset !== undefined).toBeTruthy();
  expect(xColumn?.offsetIndexOffset !== undefined).toBeTruthy();
  const plan = await source.getScanPlan({
    columns: ['payload'],
    predicate: {op: '>=', args: [{property: 'x'}, 100]}
  });
  expect(plan.pages.indexesRead).toBe(2);
  expect(plan.pages.plans[0]?.selectedPages).toBe(1);
  expect(plan.pages.plans[0]?.totalPages).toBe(2);
  const emptyPlan = await source.getScanPlan({
    columns: ['payload'],
    predicate: {op: '>=', args: [{property: 'x'}, 1000]}
  });
  expect(emptyPlan.pages.plans.map(pagePlan => pagePlan.phase)).toEqual(['predicate']);
  const batches = await collectParquetBatches(
    source.read({columns: ['payload'], predicate: {op: '>=', args: [{property: 'x'}, 100]}})
  );
  expect(batches.flatMap(batch => Array.from(batch.data.getChild('payload')?.toArray() || []))).toEqual(['hundred', 'hundred-one']);
  await source.close();
  });

test('ParquetSource#read selects row groups and columns with exact provenance', async () => {
  const fixture = await createSelectiveFixture();
  const requests: RangeRequestRecord[] = [];
  const source = createRemoteSource(createRangeFetch(fixture, {requests}));
  const metadata = await source.getMetadata();
  const metadataRequestCount = requests.length;
  const batches = await collectParquetBatches(
    source.read({rowGroups: [1], columns: ['x', 'source_id'], batchSize: 1, concurrency: 2})
  );

  expect(metadata.rowGroups.map(rowGroup => rowGroup.rowOffset)).toEqual([0, 2, 4]);
  expect(batches.length).toBe(2);
  expect(batches.map(batch => batch.rowGroupIndex)).toEqual([1, 1]);
  expect(batches.map(batch => batch.rowOffset)).toEqual([2, 3]);
  expect(batches.map(batch => batch.rowGroupRowOffset)).toEqual([0, 1]);
  expect(batches.every(
      batch =>
        batch.source === REMOTE_URL &&
        batch.sourceId === REMOTE_URL &&
        batch.sourceUrl === REMOTE_URL
    )).toBeTruthy();
  expect(batches.flatMap(batch => Array.from(batch.data.getChild('x')?.toArray() || []))).toEqual([2, 3]);
  expect(batches.flatMap(batch => Array.from(batch.data.getChild('source_id')?.toArray() || []))).toEqual(['source-2', 'source-3']);
  expect(batches[0].schema?.fields.map(field => field.name)).toEqual(['x', 'source_id']);
  expect(batches[0].data.getChild('ignored_payload')).toBeFalsy();
  expect(Object.isFrozen(batches[0].metadata)).toBeTruthy();

  const selectedRanges = getColumnRanges(metadata, 1, ['x', 'source_id']);
  const dataRequests = requests.slice(metadataRequestCount);
  expect(dataRequests.length > 0).toBeTruthy();
  expect(dataRequests.every(request =>
      selectedRanges.some(range => request.start >= range.start && request.end <= range.end)
    )).toBeTruthy();
  await source.close();
  });

test('ParquetSource#executeScanPlan reuses selected row groups', async () => {
  const fixture = await createSelectiveFixture();
  const source = createRemoteSource(createRangeFetch(fixture));
  const plan = await source.getScanPlan({
    columns: ['source_id'],
    predicate: {op: '=', args: [{property: 'x'}, 2]}
  });
  const batches = await collectParquetBatches(source.executeScanPlan(plan));
  expect(batches.flatMap(batch => Array.from(batch.data.getChild('source_id')?.toArray() || []))).toEqual(['source-2']);
  expect(batches.every(batch => batch.rowGroupIndex === 1)).toBeTruthy();
  await source.close();
  });

test('ParquetSource#read late-materializes projected columns after predicate matches', async () => {
  const fixture = await createSelectiveFixture();
  const requests: RangeRequestRecord[] = [];
  const source = createRemoteSource(createRangeFetch(fixture, {requests}));
  const metadata = await source.getMetadata();
  const metadataRequestCount = requests.length;
  const batches = await collectParquetBatches(
    source.read({
      columns: ['source_id'],
      predicate: {op: '=', args: [{property: 'x'}, 2]}
    })
  );
  const dataRequests = requests.slice(metadataRequestCount);
  const predicateRanges = getColumnRanges(metadata, 1, ['x']);
  const projectedRanges = getColumnRanges(metadata, 1, ['source_id']);
  const ignoredRanges = getColumnRanges(metadata, 1, ['ignored_payload']);

  expect(batches.flatMap(batch => Array.from(batch.data.getChild('source_id')?.toArray() || []))).toEqual(['source-2']);
  expect(batches[0]?.schema?.fields.map(field => field.name)).toEqual(['source_id']);
  expect(dataRequests.some(request =>
      predicateRanges.some(range => request.start >= range.start && request.end <= range.end)
    ) &&
      dataRequests.some(request =>
        projectedRanges.some(range => request.start >= range.start && request.end <= range.end)
      )).toBeTruthy();
  expect(dataRequests.some(request =>
      ignoredRanges.some(range => request.start >= range.start && request.end <= range.end)
    )).toBeFalsy();
  await source.close();
  });

test('ParquetSource#worker transfers selected rows as hydrated Arrow buffers', async () => {
  if (!isBrowser) {
        return;
  }

  const fixture = await createSelectiveFixture();
  const source = (await load(new Blob([fixture]), ParquetSourceLoader, {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'}
  })) as ParquetSource;
  let mainThreadTicked = false;
  const batchesPromise = collectParquetBatches(
    source.read({rowGroups: [1], columns: ['x', 'source_id'], batchSize: 1})
  );
  await new Promise<void>(resolve =>
    setTimeout(() => {
      mainThreadTicked = true;
      resolve();
    }, 0)
  );
  const batches = await batchesPromise;

  expect(mainThreadTicked).toBeTruthy();
  expect(batches.flatMap(batch => Array.from(batch.data.getChild('x')?.toArray() || []))).toEqual([2, 3]);
  expect(batches.map(batch => batch.rowOffset)).toEqual([2, 3]);
  await source.close();
  });

test('ParquetSource#worker late-materializes projected columns after filtering', async () => {
  if (!isBrowser) {
        return;
  }

  const fixture = await createSelectiveFixture();
  const requests: RangeRequestRecord[] = [];
  const source = createRemoteSource(createRangeFetch(fixture, {requests}), {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'}
  });
  const metadata = await source.getMetadata();
  const metadataRequestCount = requests.length;
  const batches = await collectParquetBatches(
    source.read({
      columns: ['source_id'],
      predicate: {op: '=', args: [{property: 'x'}, 2]}
    })
  );
  const dataRequests = requests.slice(metadataRequestCount);
  const ignoredRanges = metadata.rowGroups.flatMap(rowGroup =>
    getColumnRanges(metadata, rowGroup.index, ['ignored_payload'])
  );

  expect(batches.flatMap(batch => Array.from(batch.data.getChild('source_id')?.toArray() || []))).toEqual(['source-2']);
  expect(batches[0]?.schema?.fields.map(field => field.name)).toEqual(['source_id']);
  expect(dataRequests.some(request =>
      ignoredRanges.some(range => request.start >= range.start && request.end <= range.end)
    )).toBeFalsy();
  await source.close();
  });

test('ParquetSource worker decoder batches projected columns into transferable Arrow data', async () => {
  const fixture = await createSelectiveFixture();
  const input = await createParquetSourceWorkerInput(fixture, 1, ['x', 'source_id']);

  const result = await decodeParquetSourceWorkerInput(input);
  const arrowTables = result.batches.map(batch => hydrateArrowTable(batch.arrowTable));

  expect(result.rowCount).toBe(2);
  expect(result.batches.map(batch => batch.rowGroupRowOffset)).toEqual([0, 1]);
  expect(result.batches.map(batch => batch.rowCount)).toEqual([1, 1]);
  expect(arrowTables.flatMap(table => Array.from(table.getChild('x')?.toArray() || []))).toEqual([2, 3]);
  expect(arrowTables.flatMap(table => Array.from(table.getChild('source_id')?.toArray() || []))).toEqual(['source-2', 'source-3']);
  expect(arrowTables[0].getChild('ignored_payload')).toBeFalsy();
  expect(result.decodeDurationMs >= 0).toBeTruthy();
  expect(result.arrowConversionDurationMs >= 0).toBeTruthy();
  await expect(decodeParquetSourceWorkerInput({...input, ranges: []})).rejects.toThrow(/unavailable byte range/);
  });

test('ParquetSource#read preserves the caller AbortSignal reason', async () => {
  const fixture = await createSelectiveFixture();
  const source = new ParquetSource(new Blob([fixture]), {
    core: {worker: isBrowser, reuseWorkers: false, _workerType: 'test'}
  });
  const abortController = new AbortController();
  const abortReason = new Error('Query superseded');
  const iterator = source.read({batchSize: 1, signal: abortController.signal})[Symbol.asyncIterator]();

  const firstResult = await iterator.next();
  expect(firstResult.done).toBeFalsy();
  abortController.abort(abortReason);
  await expect(iterator.next()).rejects.toThrow(abortReason);

  await source.close();
  });

test('ParquetSource#read cancels outstanding ranges when iteration ends early', async () => {
  const fixture = await createSelectiveFixture();
  let markBlockedRequestStarted: () => void = () => {};
  const blockedRequestStarted = new Promise<void>(resolve => {
    markBlockedRequestStarted = resolve;
  });
  let blockedRequestAborted = false;
  let blockedRange: {start: number; end: number} | null = null;
  const rangeFetch = createRangeFetch(fixture, {
    intercept: (request, requestOptions) => {
      if (!blockedRange || request.start < blockedRange.start || request.end > blockedRange.end) {
        return null;
      }
      markBlockedRequestStarted();
      return new Promise<Response>((_resolve, reject) => {
        const rejectAborted = (): void => {
          blockedRequestAborted = true;
          reject(createAbortError());
        };
        if (requestOptions.signal?.aborted) {
          rejectAborted();
        } else {
          requestOptions.signal?.addEventListener('abort', rejectAborted, {once: true});
        }
      });
    }
  });
  const source = createRemoteSource(rangeFetch);
  const metadata = await source.getMetadata();
  [blockedRange] = getColumnRanges(metadata, 1, ['x']);

  const iterator = source
    .read({rowGroups: [0, 1], columns: ['x'], concurrency: 2})
    [Symbol.asyncIterator]();
  const firstBatch = await iterator.next();
  await blockedRequestStarted;
  expect(firstBatch.value?.rowGroupIndex).toBe(0);
  await iterator.return?.();
  expect(blockedRequestAborted).toBeTruthy();
  expect(source.getTelemetry().cancellationCount).toBe(1);
  expect(source.getTelemetry().abortedRangeRequestCount >= 1).toBeTruthy();
  await source.close();
  });

test('ParquetSource#prunes row groups and reports exact cumulative telemetry', async () => {
  const fixture = await createSelectiveFixture();
  const requests: RangeRequestRecord[] = [];
  const events: ParquetTelemetryEvent[] = [];
  const source = createRemoteSource(createRangeFetch(fixture, {requests}), {
    parquet: {onTelemetry: event => events.push(event)}
  });
  const metadata = await source.getMetadata();
  const metadataRequestCount = requests.length;
  const batches = await collectParquetBatches(
    source.read({
      rowGroups: [0, 1, 2],
      columns: ['x'],
      rowGroupFilter: rowGroup => rowGroup.index !== 1
    })
  );
  const telemetry = source.getTelemetry();
  const downloadedBytes = requests.reduce(
    (sum, request) => sum + request.end - request.start + 1,
    0
  );
  const prunedRanges = getColumnRanges(metadata, 1, ['x']);
  const dataRequests = requests.slice(metadataRequestCount);

  expect(batches.flatMap(batch => Array.from(batch.data.getChild('x')?.toArray() || []))).toEqual([0, 1, 4, 5]);
  expect(dataRequests.every(request =>
      prunedRanges.every(range => request.end < range.start || request.start > range.end)
    )).toBeTruthy();
  expect(telemetry.rangeRequestCount).toBe(requests.length);
  expect(telemetry.requestedBytes).toBe(downloadedBytes);
  expect(telemetry.downloadedBytes).toBe(downloadedBytes);
  expect(telemetry.cacheHits).toBe(1);
  expect(telemetry.rowGroupsRequested).toBe(3);
  expect(telemetry.rowGroupsPruned).toBe(1);
  expect(telemetry.rowGroupsDecoded).toBe(2);
  expect(telemetry.batchesEmitted).toBe(2);
  expect(telemetry.rowsEmitted).toBe(4);
  expect(telemetry.networkDurationMs >= 0).toBeTruthy();
  expect(telemetry.decodeDurationMs >= 0).toBeTruthy();
  expect(telemetry.arrowConversionDurationMs >= 0).toBeTruthy();
  expect(events.some(event => event.type === 'row-group-prune')).toBeTruthy();
  expect(events.some(event => event.type === 'batch')).toBeTruthy();
  await source.close();
  });

test('ParquetSource#read rethrows range errors and validates selections', async () => {
  const fixture = await createSelectiveFixture();
  let failedRange: {start: number; end: number} | null = null;
  const source = createRemoteSource(
    createRangeFetch(fixture, {
      intercept: request => {
        if (failedRange && request.start >= failedRange.start && request.end <= failedRange.end) {
          return Promise.reject(new Error('selected range failed'));
        }
        return null;
      }
    })
  );
  const metadata = await source.getMetadata();
  [failedRange] = getColumnRanges(metadata, 2, ['x']);

  await expect(collectParquetBatches(source.read({rowGroups: [2], columns: ['x']}))).rejects.toThrow(/selected range failed/);
  await expect(collectParquetBatches(source.read({rowGroups: [3]}))).rejects.toThrow(/row-group index 3/);
  await expect(collectParquetBatches(source.read({columns: ['missing']}))).rejects.toThrow(/column not found: missing/);
  await source.close();
  });

test('ParquetSourceLoader#URL uses bounded, versioned range requests', async () => {
  const fixture = await loadFixture();
  const requests: RangeRequestRecord[] = [];
  const rangeFetch = createRangeFetch(fixture, {requests});
  const source = createRemoteSource(rangeFetch, {
    parquet: {headers: {Authorization: 'Bearer test'}}
  });

  const metadata = await source.getMetadata();
  const requestCount = requests.length;
  await source.getMetadata();
  await source.getSchema();

  expect(requests[0].headers.get('Range')).toBe('bytes=0-3');
  expect(requests[0].headers.get('Authorization')).toBe('Bearer test');
  expect(requests[1].headers.get('If-Match')).toBe('"fixture-v1"');
  expect(requests.length).toBe(requestCount);
  expect(metadata.fileByteLength).toBe(fixture.byteLength);
  expect(metadata.objectVersion?.etag).toBe('"fixture-v1"');
  expect(requests.every(request => request.headers.get('Range') !== `bytes=0-${fixture.byteLength - 1}`)).toBeTruthy();
  await source.close();
  });

test('ParquetSourceLoader#rejects object version changes', async () => {
  const fixture = await loadFixture();
  const rangeFetch = createRangeFetch(fixture, {
    getEtag: requestIndex => (requestIndex === 0 ? '"fixture-v1"' : '"fixture-v2"')
  });
  const source = createRemoteSource(rangeFetch);

  await expect(source.getMetadata()).rejects.toThrow(/ETag changed/);
  await source.close();
  });

test('ParquetSourceLoader#abort and close cancel initialization', async () => {
  const callerAbortController = new AbortController();
  const callerFetch = createPendingFetch();
  const callerSource = createRemoteSource(callerFetch.fetch);
  const callerRequest = callerSource.getMetadata({signal: callerAbortController.signal});
  await callerFetch.started;
  callerAbortController.abort();
  await expect(callerRequest).rejects.toThrow(/abort/i);

  const closeFetch = createPendingFetch();
  const closeSource = createRemoteSource(closeFetch.fetch);
  const closeRequest = closeSource.getMetadata();
  await closeFetch.started;
  await closeSource.close();
  await expect(closeRequest).rejects.toThrow(/abort/i);
  await expect(closeSource.getMetadata()).rejects.toThrow(/closed/i);
  });

test('ParquetRangeFile#close cancels oversized uncached reads', async () => {
  const fileByteLength = 100_000;
  let requestCount = 0;
  let markReadStarted: () => void = () => {};
  const readStarted = new Promise<void>(resolve => {
    markReadStarted = resolve;
  });
  const file = new ParquetRangeFile(REMOTE_URL, {
    fetch: async (_url, options = {}) => {
      requestCount++;
      if (requestCount === 1) {
        return new Response(new Uint8Array(4), {
          status: 206,
          headers: {'Content-Range': `bytes 0-3/${fileByteLength}`, ETag: '"fixture-v1"'}
        });
      }
      markReadStarted();
      return await new Promise<Response>((_resolve, reject) => {
        const rejectAborted = () => reject(createAbortError());
        if (options.signal?.aborted) {
          rejectAborted();
        } else {
          options.signal?.addEventListener('abort', rejectAborted, {once: true});
        }
      });
    }
  });

  await file.open();
  const read = file.read(4, 70_000);
  await readStarted;
  await file.close();

  await expect(read).rejects.toThrow(/abort/i);
});

/** Loads the shared Parquet fixture into memory for deterministic transport tests. */
async function loadFixture(url = FIXTURE_URL): Promise<ArrayBuffer> {
  const response = await fetchFile(url);
  return await response.arrayBuffer();
}

/** Encodes a deterministic three-row-group fixture with a deliberately large ignored column. */
async function createSelectiveFixture(): Promise<ArrayBuffer> {
  selectiveFixturePromise ||= encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'x', type: 'int32', nullable: false},
          {name: 'y', type: 'int32', nullable: false},
          {name: 'source_id', type: 'utf8', nullable: false},
          {name: 'ignored_payload', type: 'utf8', nullable: false}
        ],
        metadata: {}
      },
      data: Array.from({length: 6}, (_, index) => ({
        x: index,
        y: 100 + index,
        source_id: `source-${index}`,
        ignored_payload: String(index).repeat(16_384)
      }))
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {parquet: {rowGroupSize: 2}}
  );
  return await selectiveFixturePromise;
}

/** Creates a direct worker job from one fixture row group for shared decoder tests. */
async function createParquetSourceWorkerInput(
  fixture: ArrayBuffer,
  rowGroupIndex: number,
  selectedColumns: string[]
): Promise<ParquetSourceWorkerInput> {
  const reader = new ParquetReader(new BlobFile(fixture));
  const fileMetadata = await reader.getFileMetadata();
  const parquetSchema = await reader.getSchema();
  const schema = await getSchemaFromParquetReader(reader);
  const rowGroup = fileMetadata.row_groups[rowGroupIndex];
  const selectedColumnChunks = rowGroup.columns.filter(columnChunk => {
    const path = columnChunk.meta_data?.path_in_schema;
    return Boolean(path && selectedColumns.includes(path[0]));
  });
  const ranges = selectedColumnChunks.map(columnChunk => {
    const columnMetadata = columnChunk.meta_data;
    if (!columnMetadata) {
      throw new Error('Parquet column chunk is missing metadata');
    }
    const dataPageOffset = Number(columnMetadata.data_page_offset);
    const dictionaryPageOffset = Number(columnMetadata.dictionary_page_offset || dataPageOffset);
    const offset = Math.min(dataPageOffset, dictionaryPageOffset);
    const length = Number(columnMetadata.total_compressed_size);
    return {offset, data: fixture.slice(offset, offset + length)};
  });

  reader.close();
  return {
    fileByteLength: fixture.byteLength,
    rowCount: Number(rowGroup.num_rows),
    uncompressedByteLength: Number(rowGroup.total_byte_size),
    schemaDefinition: parquetSchema.schema,
    projectedSchema: {
      ...schema,
      fields: schema.fields.filter(field => selectedColumns.includes(field.name))
    },
    columnChunks: selectedColumnChunks.map(columnChunk => {
      const columnMetadata = columnChunk.meta_data;
      if (!columnMetadata) {
        throw new Error('Parquet column chunk is missing metadata');
      }
      return {
        filePath: columnChunk.file_path || undefined,
        physicalType: columnMetadata.type,
        compressionCodec: columnMetadata.codec,
        path: [...columnMetadata.path_in_schema],
        valueCount: Number(columnMetadata.num_values),
        compressedByteLength: Number(columnMetadata.total_compressed_size),
        uncompressedByteLength: Number(columnMetadata.total_uncompressed_size),
        dataPageOffset: Number(columnMetadata.data_page_offset),
        dictionaryPageOffset:
          columnMetadata.dictionary_page_offset === undefined
            ? undefined
            : Number(columnMetadata.dictionary_page_offset)
      };
    }),
    ranges,
    batchSize: 1,
    preserveBinary: false,
    verifyPageChecksums: false
  };
}

/** Collects a selective source read for concise assertions. */
async function collectParquetBatches(batches: AsyncIterable<ParquetBatch>): Promise<ParquetBatch[]> {
  const result: ParquetBatch[] = [];
  for await (const batch of batches) {
    result.push(batch);
  }
  return result;
}

/** Returns the physical byte ranges occupied by selected row-group columns. */
function getColumnRanges(
  metadata: ParquetSourceMetadata,
  rowGroupIndex: number,
  columns: string[]
): Array<{start: number; end: number}> {
  return metadata.rowGroups[rowGroupIndex].columns
    .filter(column => columns.includes(column.path[0]))
    .map(column => ({
      start: column.fileOffset,
      end: column.fileOffset + column.compressedByteLength - 1
    }));
}

/** Creates a Parquet source with a caller-supplied loaders.gl fetch implementation. */
function createRemoteSource(
  rangeFetch: (url: string, options?: RequestInit) => Promise<Response>,
  options: ParquetSourceLoaderOptions = {}
): ParquetSource {
  return createDataSource(REMOTE_URL, [ParquetSourceLoaderWithParser], {
    ...options,
    core: {
      ...options.core,
      type: 'parquet',
      _workerType: options.core?._workerType ?? 'test',
      loadOptions: {core: {fetch: rangeFetch}}
    }
  }) as ParquetSource;
}

/** Creates a deterministic HTTP byte-range fetch over an in-memory fixture. */
function createRangeFetch(
  fixture: ArrayBuffer,
  options: RangeFetchOptions = {}
): (url: string, requestOptions?: RequestInit) => Promise<Response> {
  const requests = options.requests || [];
  return async (url: string, requestOptions: RequestInit = {}): Promise<Response> => {
    throwIfAborted(requestOptions.signal);
    const headers = new Headers(requestOptions.headers);
    const {start, end} = parseRangeHeader(headers.get('Range'));
    const requestIndex = requests.length;
    const request = {url, headers, start, end};
    requests.push(request);
    const interceptedResponse = options.intercept?.(request, requestOptions);
    if (interceptedResponse) {
      return await interceptedResponse;
    }
    const etag = options.getEtag?.(requestIndex) || '"fixture-v1"';
    return new Response(fixture.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fixture.byteLength}`,
        ETag: etag
      }
    });
  };
}

/** Creates a fetch that settles only when its request signal is aborted. */
function createPendingFetch(): {
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  started: Promise<void>;
} {
  let markStarted: () => void = () => {};
  const started = new Promise<void>(resolve => {
    markStarted = resolve;
  });
  const fetch = async (_url: string, options: RequestInit = {}): Promise<Response> => {
    markStarted();
    return await new Promise<Response>((_resolve, reject) => {
      const rejectAborted = () => reject(createAbortError());
      if (options.signal?.aborted) {
        rejectAborted();
      } else {
        options.signal?.addEventListener('abort', rejectAborted, {once: true});
      }
    });
  };
  return {fetch, started};
}

/** Parses the single-range request header produced by the source. */
function parseRangeHeader(value: string | null): {start: number; end: number} {
  const match = value?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`Unexpected Range header: ${value}`);
  }
  return {start: Number(match[1]), end: Number(match[2])};
}

/** Throws an AbortError when a mock request begins in an aborted state. */
function throwIfAborted(signal?: AbortSignal | null): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

/** Creates a cross-runtime abort error. */
function createAbortError(): Error {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
}
