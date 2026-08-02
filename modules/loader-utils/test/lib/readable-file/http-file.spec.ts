// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  HttpFile,
  RangeRequestScheduler,
  getRangeStats,
  type HttpFileFetch
} from '@loaders.gl/loader-utils';

const DATA = Uint8Array.from({length: 32}, (_, index) => index);
const URL = 'https://example.com/data.parquet';

test('HttpFile#open recognizes an empty 416 identity probe', async () => {
  let requestedRange: string | null = null;
  const file = await HttpFile.open(URL, {
    fetch: async (_url, options) => {
      requestedRange = new Headers(options?.headers).get('Range');
      return new Response(null, {
        status: 416,
        headers: {
          'Content-Range': 'bytes */0',
          ETag: '"empty-version"'
        }
      });
    }
  });

  expect(requestedRange, 'probes the first byte').toBe('bytes=0-0');
  expect(file.getIdentitySnapshot(), 'pins the empty object identity').toEqual({
    byteLength: 0,
    etag: '"empty-version"',
    lastModified: undefined
  });
  await expect(file.stat(), 'reports an empty file').resolves.toMatchObject({size: 0, bigsize: 0n});
  await expect(file.read(0, 0), 'serves an empty read without another request').resolves.toEqual(
    new ArrayBuffer(0)
  );
  expect(file.getTelemetry(), 'counts only the identity probe').toMatchObject({
    requestedBytes: 1,
    downloadedBytes: 0,
    requestCount: 1,
    errorCount: 0
  });
});

test('HttpFile#open pins identity and reports frozen transport telemetry', async () => {
  const requests: RequestInit[] = [];
  const fetch: HttpFileFetch = async (_url, options) => {
    requests.push(options || {});
    return createRangeResponse(options, {
      etag: '"version-1"',
      lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT'
    });
  };

  const file = await HttpFile.open(URL, {
    fetch,
    fetchOptions: {headers: {Authorization: 'Bearer token'}}
  });
  expect(file.getIdentitySnapshot(), 'pins response identity').toEqual({
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT'
  });
  expect(Object.isFrozen(file.getIdentitySnapshot()), 'freezes response identity').toBeTruthy();
  expect(file.size, 'sets the synchronous byte length').toBe(DATA.byteLength);

  const bytes = await file.read(4, 3);
  expect(Array.from(new Uint8Array(bytes)), 'returns the exact requested bytes').toEqual([4, 5, 6]);
  expect(
    requests.map(request => new Headers(request.headers).get('Range')),
    'uses one-byte discovery and exact data ranges'
  ).toEqual(['bytes=0-0', 'bytes=4-6']);
  expect(
    requests.every(request => new Headers(request.headers).get('Authorization') === 'Bearer token'),
    'preserves caller headers'
  ).toBeTruthy();

  const telemetry = file.getTelemetry();
  expect(telemetry, 'reports transport counters').toMatchObject({
    requestedBytes: 4,
    downloadedBytes: 4,
    requestCount: 2,
    abortCount: 0,
    errorCount: 0
  });
  expect(telemetry.networkTimeMs, 'reports network time').toBeGreaterThanOrEqual(0);
  expect(Object.isFrozen(telemetry), 'freezes telemetry snapshots').toBeTruthy();
});

test('HttpFile#known identity avoids an opening probe and enforces strict validators', async () => {
  let requestCount = 0;
  const fetch: HttpFileFetch = async (_url, options) => {
    requestCount++;
    return createRangeResponse(options, {
      etag: '"manifest-version"',
      lastModified: 'Tue, 02 Jan 2024 00:00:00 GMT'
    });
  };
  const file = await HttpFile.open(URL, {
    fetch,
    byteLength: DATA.byteLength,
    etag: '"manifest-version"',
    lastModified: 'Tue, 02 Jan 2024 00:00:00 GMT',
    consistency: 'strict'
  });

  expect(requestCount, 'does not probe a complete supplied identity').toBe(0);
  await file.read(8, 4);
  expect(requestCount, 'performs only the requested data fetch').toBe(1);
});

test('HttpFile#strict consistency rejects missing validators before consuming the body', async () => {
  let cancelCount = 0;
  const filePromise = HttpFile.open(URL, {
    consistency: 'strict',
    fetch: async (_url, options) =>
      createCancelableResponse(options, {}, () => {
        cancelCount++;
      })
  });

  await expect(filePromise, 'rejects a response without a validator').rejects.toThrow(
    /does not provide an ETag or Last-Modified/
  );
  expect(cancelCount, 'cancels the untrusted response body').toBe(1);
});

test('HttpFile#best-effort consistency accepts a stable length without validators', async () => {
  const file = await HttpFile.open(URL, {
    consistency: 'best-effort',
    fetch: async (_url, options) => createRangeResponse(options)
  });

  expect(file.getIdentitySnapshot(), 'pins the available identity').toEqual({
    byteLength: DATA.byteLength,
    etag: undefined,
    lastModified: undefined
  });
  expect(Array.from(new Uint8Array(await file.read(1, 2))), 'supports later reads').toEqual([1, 2]);
});

test('HttpFile#rejects changed validators before consuming the response body', async () => {
  let etag = '"version-1"';
  let cancelCount = 0;
  let requestCount = 0;
  const file = await HttpFile.open(URL, {
    fetch: async (_url, options) => {
      requestCount++;
      if (requestCount === 1) {
        return createRangeResponse(options, {etag});
      }
      return createCancelableResponse(options, {etag}, () => {
        cancelCount++;
      });
    }
  });
  etag = '"version-2"';

  await expect(file.read(4, 2), 'rejects the changed object').rejects.toThrow(/ETag changed/);
  expect(cancelCount, 'cancels the changed response body').toBe(1);
  expect(file.getTelemetry(), 'does not count an unconsumed response body').toMatchObject({
    requestedBytes: 3,
    downloadedBytes: 1,
    requestCount: 2,
    errorCount: 1
  });
});

test('HttpFile#uses Last-Modified when ETag is unavailable', async () => {
  let lastModified = 'Mon, 01 Jan 2024 00:00:00 GMT';
  const file = await HttpFile.open(URL, {
    consistency: 'strict',
    fetch: async (_url, options) => createRangeResponse(options, {lastModified})
  });
  lastModified = 'Tue, 02 Jan 2024 00:00:00 GMT';

  await expect(file.read(2, 2), 'rejects a changed Last-Modified value').rejects.toThrow(
    /Last-Modified value changed/
  );
});

test('HttpFile#checks Last-Modified when a best-effort response omits the pinned ETag', async () => {
  let requestCount = 0;
  const file = await HttpFile.open(URL, {
    consistency: 'best-effort',
    fetch: async (_url, options) => {
      requestCount++;
      return createRangeResponse(
        options,
        requestCount === 1
          ? {
              etag: '"version-1"',
              lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT'
            }
          : {lastModified: 'Tue, 02 Jan 2024 00:00:00 GMT'}
      );
    }
  });

  await expect(file.read(2, 2), 'rejects the changed fallback validator').rejects.toThrow(
    /Last-Modified value changed/
  );
});

test('HttpFile#rejects ignored and malformed range responses', async () => {
  let ignoredBodyCancelCount = 0;
  const ignoredRange = HttpFile.open(URL, {
    fetch: async () =>
      createCancelableRawResponse(200, {}, () => {
        ignoredBodyCancelCount++;
      })
  });
  await expect(ignoredRange, 'rejects an ignored Range header').rejects.toThrow(
    /expected 206, received 200/
  );
  expect(ignoredBodyCancelCount, 'cancels the ignored full response').toBe(1);

  let malformedBodyCancelCount = 0;
  const malformedRange = HttpFile.open(URL, {
    fetch: async () =>
      createCancelableRawResponse(206, {'Content-Range': 'invalid'}, () => {
        malformedBodyCancelCount++;
      })
  });
  await expect(malformedRange, 'rejects malformed Content-Range').rejects.toThrow(
    /invalid Content-Range/
  );
  expect(malformedBodyCancelCount, 'cancels the malformed response').toBe(1);

  let mismatchedBodyCancelCount = 0;
  const mismatchedFile = await HttpFile.open(URL, {
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    fetch: async () =>
      createCancelableRawResponse(
        206,
        {
          'Content-Range': `bytes 5-6/${DATA.byteLength}`,
          ETag: '"version-1"'
        },
        () => {
          mismatchedBodyCancelCount++;
        }
      )
  });
  await expect(mismatchedFile.read(4, 2), 'rejects a mismatched Content-Range').rejects.toThrow(
    /does not match the requested range/
  );
  expect(mismatchedBodyCancelCount, 'cancels the mismatched response').toBe(1);
});

test('HttpFile#rejects short response bodies', async () => {
  const file = await HttpFile.open(URL, {
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    fetch: async (_url, options) => {
      const {offset, length} = getRequestedRange(options);
      return new Response(DATA.slice(offset, offset + length - 1), {
        status: 206,
        headers: {
          'Content-Range': `bytes ${offset}-${offset + length - 1}/${DATA.byteLength}`,
          ETag: '"version-1"'
        }
      });
    }
  });

  await expect(file.read(4, 3), 'rejects a short body').rejects.toThrow(
    /contained 2 bytes; expected 3/
  );
  expect(file.getTelemetry(), 'counts downloaded bytes and the error').toMatchObject({
    requestedBytes: 3,
    downloadedBytes: 2,
    requestCount: 1,
    errorCount: 1
  });
});

test('HttpFile#read aborts an in-flight request and remains observable', async () => {
  let markStarted: () => void = () => {};
  const started = new Promise<void>(resolve => {
    markStarted = resolve;
  });
  const file = await HttpFile.open(URL, {
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    fetch: async (_url, options) => {
      markStarted();
      return await new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Request aborted', 'AbortError')),
          {once: true}
        );
      });
    }
  });
  const abortController = new AbortController();
  const readPromise = file.read(0, 4, abortController.signal);
  await started;
  abortController.abort();

  await expect(readPromise, 'rejects the cancelled read').rejects.toThrow(/aborted/i);
  expect(file.getTelemetry(), 'counts the transport and cancellation once').toMatchObject({
    requestedBytes: 4,
    downloadedBytes: 0,
    requestCount: 1,
    abortCount: 1,
    errorCount: 0
  });
});

test('HttpFile#read honors the persistent fetch-options signal after opening', async () => {
  let markStarted: () => void = () => {};
  const started = new Promise<void>(resolve => {
    markStarted = resolve;
  });
  const abortController = new AbortController();
  const file = await HttpFile.open(URL, {
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    fetchOptions: {signal: abortController.signal},
    fetch: async (_url, options) => {
      markStarted();
      return await new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Request aborted', 'AbortError')),
          {once: true}
        );
      });
    }
  });
  const readPromise = file.read(0, 4);
  await started;
  abortController.abort();

  await expect(readPromise, 'rejects when the persistent signal aborts').rejects.toThrow(
    /aborted/i
  );
  expect(file.getTelemetry(), 'counts the persistent cancellation').toMatchObject({
    requestedBytes: 4,
    downloadedBytes: 0,
    requestCount: 1,
    abortCount: 1,
    errorCount: 0
  });
});

test('HttpFile#concurrent callers cancel identity waits independently', async () => {
  let markProbeStarted: () => void = () => {};
  let probeOptions: RequestInit | undefined;
  const probeStarted = new Promise<void>(resolve => {
    markProbeStarted = resolve;
  });
  let releaseProbe: (response: Response) => void = () => {};
  const fetch: HttpFileFetch = async (_url, options) => {
    probeOptions = options;
    markProbeStarted();
    return await new Promise<Response>(resolve => {
      releaseProbe = resolve;
    });
  };
  const file = new HttpFile(URL, {fetch});
  const firstAbortController = new AbortController();
  const secondAbortController = new AbortController();
  const firstOpen = file.open(firstAbortController.signal);
  const secondOpen = file.open(secondAbortController.signal);

  await probeStarted;
  firstAbortController.abort();
  await expect(firstOpen, 'cancels only the first caller').rejects.toThrow(/aborted/i);
  expect(probeOptions?.signal?.aborted, 'keeps the shared probe alive').toBeFalsy();

  releaseProbe(
    createRangeResponse(probeOptions, {
      etag: '"version-1"'
    })
  );
  await expect(secondOpen, 'allows the second caller to finish').resolves.toBe(file);
  expect(file.getIdentitySnapshot(), 'caches the completed shared probe').toEqual({
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    lastModified: undefined
  });
  expect(file.getTelemetry(), 'counts one probe and one cancelled waiter').toMatchObject({
    requestedBytes: 1,
    downloadedBytes: 1,
    requestCount: 1,
    abortCount: 1,
    errorCount: 0
  });
});

test('HttpFile#shared scheduler isolates request contexts', async () => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 32});
  const authorizations: (string | null)[] = [];
  const fetch: HttpFileFetch = async (_url, options) => {
    authorizations.push(new Headers(options?.headers).get('Authorization'));
    return createRangeResponse(options, {etag: '"version-1"'});
  };
  const firstFile = await HttpFile.open(URL, {
    fetch,
    fetchOptions: {headers: {Authorization: 'Bearer first'}},
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    rangeScheduler: scheduler
  });
  const secondFile = await HttpFile.open(URL, {
    fetch,
    fetchOptions: {headers: {Authorization: 'Bearer second'}},
    byteLength: DATA.byteLength,
    etag: '"version-1"',
    rangeScheduler: scheduler
  });

  await Promise.all([firstFile.read(0, 2), secondFile.read(4, 2)]);
  expect(authorizations.sort(), 'preserves both authentication contexts').toEqual([
    'Bearer first',
    'Bearer second'
  ]);
  expect(
    getRangeStats(scheduler.stats).transportRanges,
    'does not coalesce requests across isolated files'
  ).toBe(2);
});

function createRangeResponse(
  options?: RequestInit,
  identity: {etag?: string; lastModified?: string} = {}
): Response {
  const {offset, length} = getRequestedRange(options);
  const headers = new Headers({
    'Content-Range': `bytes ${offset}-${offset + length - 1}/${DATA.byteLength}`
  });
  if (identity.etag) {
    headers.set('ETag', identity.etag);
  }
  if (identity.lastModified) {
    headers.set('Last-Modified', identity.lastModified);
  }
  return new Response(DATA.slice(offset, offset + length), {status: 206, headers});
}

function createCancelableResponse(
  options: RequestInit | undefined,
  identity: {etag?: string; lastModified?: string},
  onCancel: () => void
): Response {
  const {offset, length} = getRequestedRange(options);
  const headers: Record<string, string> = {
    'Content-Range': `bytes ${offset}-${offset + length - 1}/${DATA.byteLength}`
  };
  if (identity.etag) {
    headers.ETag = identity.etag;
  }
  if (identity.lastModified) {
    headers['Last-Modified'] = identity.lastModified;
  }
  return createCancelableRawResponse(206, headers, onCancel);
}

function createCancelableRawResponse(
  status: number,
  headers: HeadersInit,
  onCancel: () => void
): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Uint8Array.of(0));
    },
    cancel() {
      onCancel();
    }
  });
  return new Response(body, {status, headers});
}

function getRequestedRange(options?: RequestInit): {offset: number; length: number} {
  const range = new Headers(options?.headers).get('Range');
  const match = range?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid test Range header: ${range}`);
  }
  const offset = Number(match[1]);
  return {offset, length: Number(match[2]) - offset + 1};
}
