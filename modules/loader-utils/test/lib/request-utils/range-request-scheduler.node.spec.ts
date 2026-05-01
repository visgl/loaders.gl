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
    expect(getRangeStats(stats), 'reads typed RangeStats from probe.gl Stats').toEqual({
      logicalRanges: 2,
      rangeBatches: 1,
      transportRanges: 1,
      completedTransportRanges: 1,
      coalescedRanges: 1,
      requestedBytes: 8,
      transportBytes: 10,
      responseBytes: 10,
      overfetchBytes: 2,
      failedTransportRanges: 0,
      abortedLogicalRanges: 0,
      fullResponseFallbacks: 0
    });
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
      fetch: fetchRange,
      fetchOptions: {headers: {Authorization: 'Bearer token'}}
    });
    const secondTilePromise = scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 16,
      length: 4,
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
