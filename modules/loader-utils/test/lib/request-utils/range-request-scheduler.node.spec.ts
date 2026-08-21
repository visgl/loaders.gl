// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RangeRequestScheduler, createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';
import {expect, test} from 'vitest';
import {advanceTimersAndFlush, withFakeTimers} from '@loaders.gl/test-utils/vitest';
const BYTES = new Uint8Array(256).map((_, index) => index);
test('RangeRequestScheduler#merges ranges within rangeExpansionBytes', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
    const fetches: {
      offset: number;
      length: number;
    }[] = [];
    const fetchRange = async (offset: number, length: number) => {
      fetches.push({offset, length});
      return BYTES.buffer.slice(offset, offset + length);
    };
    const firstTilePromise = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange
    });
    const secondTilePromise = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 16,
      length: 4,
      fetchRange
    });

    await advanceTimersAndFlush();

    const [firstTile, secondTile] = await Promise.all([firstTilePromise, secondTilePromise]);
    expect(fetches, 'requests one merged range').toEqual([{offset: 10, length: 10}]);
    expect(Array.from(new Uint8Array(firstTile)), 'returns first range').toEqual([10, 11, 12, 13]);
    expect(Array.from(new Uint8Array(secondTile)), 'returns second range').toEqual([
      16, 17, 18, 19
    ]);
  });
});
test('RangeRequestScheduler#stats and events describe coalesced ranges', async () => {
  await withFakeTimers(async () => {
    const stats = createRangeStats('range-request-scheduler-test');
    const events: {
      type: string;
      logicalRequestCount?: number;
      transportRequestCount?: number;
    }[] = [];
    const scheduler = new RangeRequestScheduler({
      batchDelayMs: 0,
      rangeExpansionBytes: 8,
      stats,
      onEvent: event => events.push(event)
    });
    const fetchRange = async (offset: number, length: number) => ({
      arrayBuffer: BYTES.buffer.slice(offset, offset + length),
      status: 206,
      transportBytes: length
    });
    const firstRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange
    });
    const secondRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 16,
      length: 4,
      fetchRange
    });

    await advanceTimersAndFlush();
    await Promise.all([firstRequest, secondRequest]);

    expect(stats.get('Logical Range Requests').count, 'counts logical requests').toBe(2);
    expect(stats.get('Range Request Batches').count, 'counts batches').toBe(1);
    expect(stats.get('Transport Ranges Created').count, 'counts merged transport ranges').toBe(1);
    expect(stats.get('Coalesced Logical Ranges').count, 'counts coalesced logical ranges').toBe(1);
    expect(
      stats.get('Range Transport Requests Completed').count,
      'counts completed transport requests'
    ).toBe(1);
    expect(stats.get('Range Overfetch Bytes').count, 'counts over-fetched gap bytes').toBe(2);
    const rangeStats = getRangeStats(stats);
    expect(rangeStats, 'reads typed RangeStats from probe.gl Stats').toEqual({
      logicalRanges: 2,
      rangeBatches: 1,
      transportRanges: 1,
      completedTransportRanges: 1,
      coalescedRanges: 1,
      requestedBytes: 8,
      transportBytes: 10,
      responseBytes: 10,
      networkTimeMs: rangeStats.networkTimeMs,
      overfetchBytes: 2,
      failedTransportRanges: 0,
      abortedLogicalRanges: 0,
      fullResponseFallbacks: 0
    });
    expect(rangeStats.networkTimeMs, 'records aggregate transport time').toBeGreaterThanOrEqual(0);
    expect(
      events.some(event => event.type === 'batch' && event.logicalRequestCount === 2),
      'emits batch event'
    ).toBeTruthy();
    expect(
      events.some(event => event.type === 'batch' && event.transportRequestCount === 1),
      'emits merged transport request count'
    ).toBeTruthy();
    expect(
      events.some(event => event.type === 'response'),
      'emits response event'
    ).toBeTruthy();
  });
});
test('RangeRequestScheduler#accepts maxGapBytes as rangeExpansionBytes alias', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0, maxGapBytes: 8});
    const fetches: {
      offset: number;
      length: number;
    }[] = [];
    const fetchRange = async (offset: number, length: number) => {
      fetches.push({offset, length});
      return BYTES.buffer.slice(offset, offset + length);
    };

    const firstRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange
    });
    const secondRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 16,
      length: 4,
      fetchRange
    });

    await advanceTimersAndFlush();
    await Promise.all([firstRequest, secondRequest]);

    expect(fetches, 'uses legacy maxGapBytes value').toEqual([{offset: 10, length: 10}]);
  });
});
test('RangeRequestScheduler#fetch sends merged HTTP range and preserves headers', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
    const isolationKey = {};
    const fetches: {
      url: string;
      authorization: string | null;
      range: string | null;
    }[] = [];
    const fetchRange = async (url: string, options?: RequestInit) => {
      const headers = new Headers(options?.headers);
      fetches.push({
        url,
        authorization: headers.get('Authorization'),
        range: headers.get('Range')
      });
      return new Response(BYTES.buffer.slice(10, 20), {
        status: 206,
        headers: {'Content-Range': 'bytes 10-19/256'}
      });
    };
    const firstTilePromise = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 10,
      length: 4,
      isolationKey,
      fetch: fetchRange,
      fetchOptions: {headers: {Authorization: 'Bearer token'}}
    });
    const secondTilePromise = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 16,
      length: 4,
      isolationKey,
      fetch: fetchRange,
      fetchOptions: {headers: {Authorization: 'Bearer token'}}
    });

    await advanceTimersAndFlush();

    const [firstTile, secondTile] = await Promise.all([firstTilePromise, secondTilePromise]);
    expect(fetches, 'requests one merged HTTP range and preserves caller headers').toEqual([
      {
        url: 'https://example.com/archive.pmtiles',
        authorization: 'Bearer token',
        range: 'bytes=10-19'
      }
    ]);
    expect(Array.from(new Uint8Array(firstTile)), 'returns first range').toEqual([10, 11, 12, 13]);
    expect(Array.from(new Uint8Array(secondTile)), 'returns second range').toEqual([
      16, 17, 18, 19
    ]);
  });
});
test('RangeRequestScheduler#fetch isolates request contexts by default', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
    const authorizations: (string | null)[] = [];
    const fetch = async (_url: string, options?: RequestInit) => {
      authorizations.push(new Headers(options?.headers).get('Authorization'));
      const range = new Headers(options?.headers).get('Range');
      const match = range?.match(/^bytes=(\d+)-(\d+)$/);
      if (!match) {
        throw new Error('Missing test range');
      }
      const offset = Number(match[1]);
      const endOffset = Number(match[2]);
      return new Response(BYTES.buffer.slice(offset, endOffset + 1), {status: 206});
    };
    const firstRequest = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 10,
      length: 4,
      fetch,
      fetchOptions: {headers: {Authorization: 'Bearer first'}}
    });
    const secondRequest = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 16,
      length: 4,
      fetch,
      fetchOptions: {headers: {Authorization: 'Bearer second'}}
    });

    await advanceTimersAndFlush();
    await Promise.all([firstRequest, secondRequest]);

    expect(authorizations.sort(), 'does not share transport contexts without opt-in').toEqual([
      'Bearer first',
      'Bearer second'
    ]);
    expect(getRangeStats(scheduler.stats).transportRanges, 'creates two transport requests').toBe(
      2
    );
  });
});
test('RangeRequestScheduler#fetch preserves the offset-zero 416 clamp fallback', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    let fetchCount = 0;
    const request = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 0,
      length: 64,
      fetch: async () => {
        fetchCount++;
        if (fetchCount === 1) {
          return new Response(null, {
            status: 416,
            headers: {'Content-Range': 'bytes */32'}
          });
        }
        return new Response(BYTES.buffer.slice(0, 32), {status: 206});
      }
    });

    await advanceTimersAndFlush();
    const result = await request;

    expect(result.byteLength, 'returns the server-reported shorter object').toBe(32);
    expect(fetchCount, 'retries using the object length').toBe(2);
    expect(getRangeStats(scheduler.stats).fullResponseFallbacks, 'records the fallback').toBe(1);
  });
});
test('RangeRequestScheduler#fetch accepts an HTTP range clamped at end of file', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 250,
      length: 16,
      fetch: async () =>
        new Response(BYTES.buffer.slice(250), {
          status: 206,
          headers: {'Content-Range': 'bytes 250-255/256'}
        })
    });

    await advanceTimersAndFlush();
    const result = await request;
    expect(result.byteLength, 'returns the bytes available before EOF').toBe(6);
  });
});
test('RangeRequestScheduler#fetch validates Content-Range against the request and body', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 10,
      length: 4,
      fetch: async () =>
        new Response(BYTES.buffer.slice(10, 14), {
          status: 206,
          headers: {'Content-Range': 'bytes 11-14/256'}
        })
    });
    const rejection = expect(request, 'rejects a mismatched Content-Range').rejects.toThrow(
      /does not match requested range/
    );

    await advanceTimersAndFlush();
    await rejection;
  });
});
test('RangeRequestScheduler#fetch rejects ignored range responses', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 0,
      length: 4,
      fetch: async () => new Response(BYTES.buffer, {status: 200})
    });
    const rejection = expect(request, 'rejects 200 full responses').rejects.toThrow(
      /server returned 200 instead of 206/
    );

    await advanceTimersAndFlush();
    await rejection;
    expect(
      getRangeStats(scheduler.stats).failedTransportRanges,
      'counts the failed transport range'
    ).toBe(1);
  });
});
test('RangeRequestScheduler#keeps distant ranges separate', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
    const fetches: {
      offset: number;
      length: number;
    }[] = [];
    const fetchRange = async (offset: number, length: number) => {
      fetches.push({offset, length});
      return BYTES.buffer.slice(offset, offset + length);
    };
    const firstRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange
    });
    const secondRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 100,
      length: 4,
      fetchRange
    });

    await advanceTimersAndFlush();
    await Promise.all([firstRequest, secondRequest]);

    expect(fetches, 'requests separate ranges').toEqual([
      {offset: 10, length: 4},
      {offset: 100, length: 4}
    ]);
  });
});
test('RangeRequestScheduler#batchDelayMs delays fetch', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 20});
    let fetchCount = 0;
    const fetchRange = async (offset: number, length: number) => {
      fetchCount++;
      return BYTES.buffer.slice(offset, offset + length);
    };
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 0,
      length: 1,
      fetchRange
    });

    await advanceTimersAndFlush();
    expect(fetchCount, 'does not fetch immediately').toBe(0);

    await advanceTimersAndFlush(20);
    await request;

    expect(fetchCount, 'fetches after delay').toBe(1);
  });
});
test('RangeRequestScheduler#abort before flush rejects one child request', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 20});
    const abortController = new AbortController();
    const fetchRange = async (offset: number, length: number) =>
      BYTES.buffer.slice(offset, offset + length);
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 0,
      length: 1,
      signal: abortController.signal,
      fetchRange
    });

    abortController.abort();
    const rejection = expect(request, 'rejects aborted request').rejects.toThrow(/aborted/i);

    await advanceTimersAndFlush(20);
    await rejection;
  });
});
test('RangeRequestScheduler#zero-length ranges do not call the transport', async () => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
  let fetchCount = 0;
  const result = await scheduler.scheduleRequest({
    sourceId: 'source',
    offset: 10,
    length: 0,
    fetchRange: async () => {
      fetchCount++;
      return new ArrayBuffer(0);
    }
  });

  expect(result.byteLength, 'returns an empty buffer').toBe(0);
  expect(fetchCount, 'does not call the transport').toBe(0);
  expect(getRangeStats(scheduler.stats).logicalRanges, 'does not queue a logical range').toBe(0);
});
test('RangeRequestScheduler#rejects a short merged response', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange: async () => new ArrayBuffer(3)
    });
    const rejection = expect(request, 'rejects the short response').rejects.toThrow(
      /returned 3 bytes; expected 4/
    );

    await advanceTimersAndFlush();
    await rejection;
    expect(getRangeStats(scheduler.stats).failedTransportRanges, 'counts the failure').toBe(1);
  });
});
test('RangeRequestScheduler#accepts a short response clamped at a declared end of file', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 250,
      length: 16,
      fetchRange: async () => ({
        arrayBuffer: BYTES.buffer.slice(250),
        sourceByteLength: BYTES.byteLength
      })
    });

    await advanceTimersAndFlush();
    const result = await request;
    expect(result.byteLength, 'returns the bytes available before EOF').toBe(6);
  });
});
test('RangeRequestScheduler#rejects a short response not ending at the declared source length', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange: async () => ({
        arrayBuffer: new ArrayBuffer(3),
        sourceByteLength: 256
      })
    });
    const rejection = expect(
      request,
      'rejects an incorrectly marked short response'
    ).rejects.toThrow(/returned 3 bytes; expected 4/);

    await advanceTimersAndFlush();
    await rejection;
  });
});
test('RangeRequestScheduler#rejects an oversized nonzero full-response result', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange: async () => ({
        arrayBuffer: BYTES.buffer.slice(0, 20),
        fullResponse: true
      })
    });
    const rejection = expect(request, 'rejects an ambiguous full-object response').rejects.toThrow(
      /returned 20 bytes; expected 4/
    );

    await advanceTimersAndFlush();
    await rejection;
  });
});
test('RangeRequestScheduler#diagnostic callback errors do not affect reads or telemetry', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({
      batchDelayMs: 0,
      onEvent: () => {
        throw new Error('diagnostic failure');
      }
    });
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 10,
      length: 4,
      fetchRange: async () => BYTES.buffer.slice(10, 14)
    });

    await advanceTimersAndFlush();
    const result = await request;
    expect(result.byteLength, 'still resolves the transport result').toBe(4);

    const rangeStats = getRangeStats(scheduler.stats);
    expect(rangeStats.completedTransportRanges, 'records one successful transport').toBe(1);
    expect(rangeStats.failedTransportRanges, 'does not record a diagnostic failure').toBe(0);
  });
});
test('RangeRequestScheduler#counts an in-flight abort', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const abortController = new AbortController();
    const request = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 0,
      length: 4,
      signal: abortController.signal,
      fetchRange: async (_offset, _length, signal) =>
        await new Promise<ArrayBuffer>((_resolve, reject) => {
          signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Request aborted', 'AbortError')),
            {once: true}
          );
        })
    });

    await advanceTimersAndFlush();
    abortController.abort();
    await expect(request, 'rejects the in-flight request').rejects.toThrow(/aborted/i);

    const rangeStats = getRangeStats(scheduler.stats);
    expect(rangeStats.abortedLogicalRanges, 'counts the aborted logical request').toBe(1);
    expect(rangeStats.failedTransportRanges, 'counts the failed transport').toBe(1);
  });
});
test('RangeRequestScheduler#settles coalesced aborts without poisoning active siblings', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
    const firstAbortController = new AbortController();
    const secondAbortController = new AbortController();
    let transportAbortCount = 0;
    const fetchRange = async (_offset: number, _length: number, signal?: AbortSignal) =>
      await new Promise<ArrayBuffer>((_resolve, reject) => {
        signal?.addEventListener(
          'abort',
          () => {
            transportAbortCount++;
            reject(new DOMException('Request aborted', 'AbortError'));
          },
          {once: true}
        );
      });
    const firstRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 0,
      length: 4,
      signal: firstAbortController.signal,
      fetchRange
    });
    const secondRequest = scheduler.scheduleRequest({
      sourceId: 'source',
      offset: 4,
      length: 4,
      signal: secondAbortController.signal,
      fetchRange
    });

    await advanceTimersAndFlush();
    const firstRejection = expect(firstRequest, 'rejects the first child promptly').rejects.toThrow(
      /aborted/i
    );
    firstAbortController.abort();
    await firstRejection;
    expect(transportAbortCount, 'keeps transport alive for the active sibling').toBe(0);
    expect(getRangeStats(scheduler.stats).abortedLogicalRanges, 'tracks the first abort once').toBe(
      1
    );

    const secondRejection = expect(
      secondRequest,
      'rejects the final child promptly'
    ).rejects.toThrow(/aborted/i);
    secondAbortController.abort();
    await secondRejection;
    expect(transportAbortCount, 'aborts transport after all children cancel').toBe(1);
    expect(getRangeStats(scheduler.stats).abortedLogicalRanges, 'tracks each abort once').toBe(2);
  });
});
