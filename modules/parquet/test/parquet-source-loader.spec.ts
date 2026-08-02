// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {createDataSource, fetchFile} from '@loaders.gl/core';
import {
  ParquetSourceLoader,
  type ParquetSource,
  type ParquetSourceLoaderOptions
} from '@loaders.gl/parquet';

const FIXTURE_URL = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
const REMOTE_URL = 'https://example.com/data/alltypes_plain.parquet';

type RangeRequestRecord = {
  /** Requested URL. */
  url: string;
  /** HTTP request headers. */
  headers: Headers;
};

type RangeFetchOptions = {
  /** ETag returned by each request, based on its zero-based request index. */
  getEtag?: (requestIndex: number) => string;
  /** Request log populated by the mock fetch implementation. */
  requests?: RangeRequestRecord[];
};

test('ParquetSourceLoader#Blob metadata and schema are cached', async (t) => {
  const fixture = await loadFixture();
  const source = createDataSource(new Blob([fixture]), [ParquetSourceLoader], {
    core: {type: 'parquet'}
  }) as ParquetSource;

  const metadata = await source.getMetadata();
  const schema = await source.getSchema();

  t.ok(metadata.rowCount > 0, 'reports rows');
  t.equal(metadata.rowGroupCount, metadata.rowGroups.length, 'reports row groups');
  t.equal(metadata.fileByteLength, fixture.byteLength, 'reports file byte length');
  t.ok(metadata.rowGroups[0].columns.length > 0, 'reports column chunks');
  t.ok(schema.fields.length > 0, 'decodes logical schema');
  t.equal(await source.getMetadata(), metadata, 'returns cached metadata object');
  t.equal(await source.getSchema(), schema, 'returns cached schema object');

  const formatMetadata = await source.getMetadata({formatSpecificMetadata: true});
  t.ok(formatMetadata.formatSpecificMetadata, 'optionally exposes decoded thrift footer');
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

/** Creates a Parquet source with a caller-supplied loaders.gl fetch implementation. */
function createRemoteSource(
  rangeFetch: (url: string, options?: RequestInit) => Promise<Response>,
  options: ParquetSourceLoaderOptions = {}
): ParquetSource {
  return createDataSource(REMOTE_URL, [ParquetSourceLoader], {
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
    requests.push({url, headers});
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
