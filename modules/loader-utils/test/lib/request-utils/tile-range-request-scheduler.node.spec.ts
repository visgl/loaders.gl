import {RangeRequestScheduler, createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';
import test from 'tape-promise/tape';

const sleep = (t: number) => new Promise(resolve => setTimeout(resolve, t));

const BYTES = new Uint8Array(256).map((_, index) => index);

test('RangeRequestScheduler#merges ranges within rangeExpansionBytes', async t => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
  const fetches: {offset: number; length: number}[] = [];

  const fetchRange = async (offset: number, length: number) => {
    fetches.push({offset, length});
    return BYTES.buffer.slice(offset, offset + length);
  };

  const [firstTile, secondTile] = await Promise.all([
    scheduler.scheduleRequest({sourceId: 'source', offset: 10, length: 4, fetchRange}),
    scheduler.scheduleRequest({sourceId: 'source', offset: 16, length: 4, fetchRange})
  ]);

  t.deepEqual(fetches, [{offset: 10, length: 10}], 'requests one merged range');
  t.deepEqual(Array.from(new Uint8Array(firstTile)), [10, 11, 12, 13], 'returns first range');
  t.deepEqual(Array.from(new Uint8Array(secondTile)), [16, 17, 18, 19], 'returns second range');

  t.end();
});

test('RangeRequestScheduler#stats and events describe coalesced ranges', async t => {
  const stats = createRangeStats('range-request-scheduler-test');
  const events: {type: string; logicalRequestCount?: number; transportRequestCount?: number}[] = [];
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

  await Promise.all([
    scheduler.scheduleRequest({sourceId: 'source', offset: 10, length: 4, fetchRange}),
    scheduler.scheduleRequest({sourceId: 'source', offset: 16, length: 4, fetchRange})
  ]);

  t.equal(stats.get('Logical Range Requests').count, 2, 'counts logical requests');
  t.equal(stats.get('Range Request Batches').count, 1, 'counts batches');
  t.equal(stats.get('Transport Ranges Created').count, 1, 'counts merged transport ranges');
  t.equal(stats.get('Coalesced Logical Ranges').count, 1, 'counts coalesced logical ranges');
  t.equal(
    stats.get('Range Transport Requests Completed').count,
    1,
    'counts completed transport requests'
  );
  t.equal(stats.get('Range Overfetch Bytes').count, 2, 'counts over-fetched gap bytes');
  t.deepEqual(
    getRangeStats(stats),
    {
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
    },
    'reads typed RangeStats from probe.gl Stats'
  );

  t.ok(
    events.some(event => event.type === 'batch' && event.logicalRequestCount === 2),
    'emits batch event'
  );
  t.ok(
    events.some(event => event.type === 'batch' && event.transportRequestCount === 1),
    'emits merged transport request count'
  );
  t.ok(
    events.some(event => event.type === 'response'),
    'emits response event'
  );

  t.end();
});

test('RangeRequestScheduler#accepts maxGapBytes as rangeExpansionBytes alias', async t => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0, maxGapBytes: 8});
  const fetches: {offset: number; length: number}[] = [];

  const fetchRange = async (offset: number, length: number) => {
    fetches.push({offset, length});
    return BYTES.buffer.slice(offset, offset + length);
  };

  await Promise.all([
    scheduler.scheduleRequest({sourceId: 'source', offset: 10, length: 4, fetchRange}),
    scheduler.scheduleRequest({sourceId: 'source', offset: 16, length: 4, fetchRange})
  ]);

  t.deepEqual(fetches, [{offset: 10, length: 10}], 'uses legacy maxGapBytes value');

  t.end();
});

test('RangeRequestScheduler#fetch sends merged HTTP range and preserves headers', async t => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
  const fetches: {url: string; authorization: string | null; range: string | null}[] = [];

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

  const [firstTile, secondTile] = await Promise.all([
    scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 10,
      length: 4,
      fetch: fetchRange,
      fetchOptions: {headers: {Authorization: 'Bearer token'}}
    }),
    scheduler.fetch({
      url: 'https://example.com/archive.pmtiles',
      offset: 16,
      length: 4,
      fetch: fetchRange,
      fetchOptions: {headers: {Authorization: 'Bearer token'}}
    })
  ]);

  t.deepEqual(
    fetches,
    [
      {
        url: 'https://example.com/archive.pmtiles',
        authorization: 'Bearer token',
        range: 'bytes=10-19'
      }
    ],
    'requests one merged HTTP range and preserves caller headers'
  );
  t.deepEqual(Array.from(new Uint8Array(firstTile)), [10, 11, 12, 13], 'returns first range');
  t.deepEqual(Array.from(new Uint8Array(secondTile)), [16, 17, 18, 19], 'returns second range');

  t.end();
});

test('RangeRequestScheduler#fetch rejects ignored range responses', async t => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
  const request = scheduler.fetch({
    url: 'https://example.com/archive.pmtiles',
    offset: 0,
    length: 4,
    fetch: async () => new Response(BYTES.buffer, {status: 200})
  });

  await t.rejects(request, /server returned 200 instead of 206/, 'rejects 200 full responses');
  t.equal(
    getRangeStats(scheduler.stats).failedTransportRanges,
    1,
    'counts the failed transport range'
  );

  t.end();
});

test('RangeRequestScheduler#keeps distant ranges separate', async t => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0, rangeExpansionBytes: 8});
  const fetches: {offset: number; length: number}[] = [];

  const fetchRange = async (offset: number, length: number) => {
    fetches.push({offset, length});
    return BYTES.buffer.slice(offset, offset + length);
  };

  await Promise.all([
    scheduler.scheduleRequest({sourceId: 'source', offset: 10, length: 4, fetchRange}),
    scheduler.scheduleRequest({sourceId: 'source', offset: 100, length: 4, fetchRange})
  ]);

  t.deepEqual(
    fetches,
    [
      {offset: 10, length: 4},
      {offset: 100, length: 4}
    ],
    'requests separate ranges'
  );

  t.end();
});

test('RangeRequestScheduler#batchDelayMs delays fetch', async t => {
  const scheduler = new RangeRequestScheduler({batchDelayMs: 20});
  let fetchCount = 0;

  const fetchRange = async (offset: number, length: number) => {
    fetchCount++;
    return BYTES.buffer.slice(offset, offset + length);
  };

  const request = scheduler.scheduleRequest({sourceId: 'source', offset: 0, length: 1, fetchRange});

  await sleep(0);
  t.is(fetchCount, 0, 'does not fetch immediately');

  await request;
  t.is(fetchCount, 1, 'fetches after delay');

  t.end();
});

test('RangeRequestScheduler#abort before flush rejects one child request', async t => {
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
  await t.rejects(request, /aborted/i, 'rejects aborted request');

  t.end();
});
