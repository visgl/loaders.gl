// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {createDataSource, encode, fetchFile, load} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {
  type ParquetBatch,
  ParquetJSWriter,
  ParquetSourceLoader,
  type ParquetSourceLoaderOptions,
  type ParquetSourceMetadata
} from '@loaders.gl/parquet';
import {
  ParquetSource,
  ParquetSourceLoader as ParquetSourceLoaderWithParser
} from '@loaders.gl/parquet/parquet-source-loader';

const FIXTURE_URL = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
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

test('ParquetSourceLoader#Blob metadata and schema are cached', async (t) => {
  const fixture = await loadFixture();
  const source = (await load(new Blob([fixture]), ParquetSourceLoader)) as ParquetSource;

  t.ok(source instanceof ParquetSource, 'root metadata loader preloads the runtime source');
  const metadata = await source.getMetadata();
  const schema = await source.getSchema();

  t.ok(metadata.rowCount > 0, 'reports rows');
  t.equal(metadata.rowGroupCount, metadata.rowGroups.length, 'reports row groups');
  t.equal(metadata.fileByteLength, fixture.byteLength, 'reports file byte length');
  t.equal(metadata.schema, schema, 'metadata retains the cached schema');
  t.equal(metadata.version, metadata.formatVersion, 'retains the version compatibility alias');
  t.ok(metadata.rowGroups[0].columns.length > 0, 'reports column chunks');
  t.equal(metadata.rowGroups[0].rowOffset, 0, 'reports absolute row-group offsets');
  t.equal(
    metadata.rowGroups[0].compressedSize,
    metadata.rowGroups[0].compressedByteLength,
    'retains row-group size compatibility aliases'
  );
  t.ok(metadata.rowGroups[0].columns[0].fileOffset >= 4, 'reports column chunk offsets');
  t.ok(schema.fields.length > 0, 'decodes logical schema');
  t.equal(await source.getMetadata(), metadata, 'returns cached metadata object');
  t.equal(await source.getSchema(), schema, 'returns cached schema object');
  t.ok(Object.isFrozen(metadata), 'freezes the cached metadata object');
  t.ok(Object.isFrozen(metadata.rowGroups), 'freezes the cached row-group list');
  t.ok(Object.isFrozen(metadata.rowGroups[0].columns), 'freezes cached column metadata');

  const formatMetadata = await source.getMetadata({formatSpecificMetadata: true});
  t.ok(formatMetadata.formatSpecificMetadata, 'optionally exposes decoded thrift footer');
  await source.close();
  await source.close();
  await t.rejects(source.getMetadata(), /ParquetSource is closed/, 'operations fail after close');
  t.end();
});

test('ParquetSource#preserves opaque WASM inputs by identity', async (t) => {
  const wasmUrl = Promise.resolve(new URL('https://example.com/parquet_wasm_bg.wasm'));
  const source = new ParquetSource(new Blob(), {parquet: {wasmUrl}});

  t.equal(source.options.parquet.wasmUrl, wasmUrl, 'does not recursively merge the WASM input');

  await source.close();
  t.end();
});

test('ParquetSource#read applies snapshotted source defaults', async (t) => {
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

  t.deepEqual(
    batches.map(batch => batch.rowGroupIndex),
    [1, 1],
    'uses the snapshotted default row-group selection'
  );
  t.ok(
    batches.every(batch => batch.schema?.fields[0]?.name === 'x'),
    'uses the snapshotted default column projection'
  );
  await source.close();
  t.end();
});

test('ParquetSource#read selects row groups and columns with exact provenance', async (t) => {
  const fixture = await createSelectiveFixture();
  const requests: RangeRequestRecord[] = [];
  const source = createRemoteSource(createRangeFetch(fixture, {requests}));
  const metadata = await source.getMetadata();
  const metadataRequestCount = requests.length;
  const batches = await collectParquetBatches(
    source.read({rowGroups: [1], columns: ['x', 'source_id'], batchSize: 1, concurrency: 2})
  );

  t.deepEqual(
    metadata.rowGroups.map(rowGroup => rowGroup.rowOffset),
    [0, 2, 4],
    'metadata records cumulative source row offsets'
  );
  t.equal(batches.length, 2, 'honors the requested batch size');
  t.deepEqual(
    batches.map(batch => batch.rowGroupIndex),
    [1, 1],
    'identifies the selected row group'
  );
  t.deepEqual(
    batches.map(batch => batch.rowOffset),
    [2, 3],
    'reports absolute source row offsets'
  );
  t.deepEqual(
    batches.map(batch => batch.rowGroupRowOffset),
    [0, 1],
    'reports offsets within the row group'
  );
  t.ok(
    batches.every(
      batch =>
        batch.source === REMOTE_URL &&
        batch.sourceId === REMOTE_URL &&
        batch.sourceUrl === REMOTE_URL
    ),
    'identifies the source through current and compatibility fields'
  );
  t.deepEqual(
    batches.flatMap(batch => Array.from(batch.data.getChild('x')?.toArray() || [])),
    [2, 3],
    'returns only rows from the selected row group'
  );
  t.deepEqual(
    batches.flatMap(batch => Array.from(batch.data.getChild('source_id')?.toArray() || [])),
    ['source-2', 'source-3'],
    'converts logical values directly from decoded columns'
  );
  t.deepEqual(
    batches[0].schema?.fields.map(field => field.name),
    ['x', 'source_id'],
    'projects the batch schema'
  );
  t.notOk(batches[0].data.getChild('ignored_payload'), 'does not materialize ignored columns');

  const selectedRanges = getColumnRanges(metadata, 1, ['x', 'source_id']);
  const dataRequests = requests.slice(metadataRequestCount);
  t.ok(dataRequests.length > 0, 'fetches selected column chunks');
  t.ok(
    dataRequests.every(request =>
      selectedRanges.some(range => request.start >= range.start && request.end <= range.end)
    ),
    'every post-metadata request stays inside a selected column chunk'
  );
  await source.close();
  t.end();
});

test('ParquetSource#read cancels outstanding ranges when iteration ends early', async (t) => {
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
  t.equal(firstBatch.value?.rowGroupIndex, 0, 'emits the first row group in requested order');
  await iterator.return?.();
  t.ok(blockedRequestAborted, 'aborts the concurrently requested next row group');
  await source.close();
  t.end();
});

test('ParquetSource#read rethrows range errors and validates selections', async (t) => {
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

  await t.rejects(
    collectParquetBatches(source.read({rowGroups: [2], columns: ['x']})),
    /selected range failed/,
    'rethrows transport failures'
  );
  await t.rejects(
    collectParquetBatches(source.read({rowGroups: [3]})),
    /row-group index 3/,
    'rejects an out-of-range row group'
  );
  await t.rejects(
    collectParquetBatches(source.read({columns: ['missing']})),
    /column not found: missing/,
    'rejects an unknown column before row data is read'
  );
  await source.close();
  t.end();
});

test('ParquetSourceLoader#URL uses bounded, versioned range requests', async (t) => {
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

  t.equal(requests[0].headers.get('Range'), 'bytes=0-3', 'opens with four-byte probe');
  t.equal(requests[0].headers.get('Authorization'), 'Bearer test', 'forwards source headers');
  t.equal(requests[1].headers.get('If-Match'), '"fixture-v1"', 'pins later ranges');
  t.equal(requests.length, requestCount, 'metadata and schema share one initialization');
  t.equal(metadata.fileByteLength, fixture.byteLength, 'parses object length from Content-Range');
  t.equal(metadata.objectVersion?.etag, '"fixture-v1"', 'exposes captured object version');
  t.ok(
    requests.every(request => request.headers.get('Range') !== `bytes=0-${fixture.byteLength - 1}`),
    'does not request the complete object'
  );
  await source.close();
  t.end();
});

test('ParquetSourceLoader#rejects object version changes', async (t) => {
  const fixture = await loadFixture();
  const rangeFetch = createRangeFetch(fixture, {
    getEtag: requestIndex => (requestIndex === 0 ? '"fixture-v1"' : '"fixture-v2"')
  });
  const source = createRemoteSource(rangeFetch);

  await t.rejects(source.getMetadata(), /ETag changed/, 'rejects mixed-version footer reads');
  await source.close();
  t.end();
});

test('ParquetSourceLoader#abort and close cancel initialization', async (t) => {
  const callerAbortController = new AbortController();
  const callerFetch = createPendingFetch();
  const callerSource = createRemoteSource(callerFetch.fetch);
  const callerRequest = callerSource.getMetadata({signal: callerAbortController.signal});
  await callerFetch.started;
  callerAbortController.abort();
  await t.rejects(callerRequest, /abort/i, 'caller signal aborts the opening range');

  const closeFetch = createPendingFetch();
  const closeSource = createRemoteSource(closeFetch.fetch);
  const closeRequest = closeSource.getMetadata();
  await closeFetch.started;
  await closeSource.close();
  await t.rejects(closeRequest, /abort/i, 'closing the source aborts the opening range');
  await t.rejects(closeSource.getMetadata(), /closed/i, 'closed sources cannot be reopened');
  t.end();
});

/** Loads the shared Parquet fixture into memory for deterministic transport tests. */
async function loadFixture(): Promise<ArrayBuffer> {
  const response = await fetchFile(FIXTURE_URL);
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
