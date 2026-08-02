// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {RangeRequestSource} from '../src/lib/range-request-source';

const BYTES = Uint8Array.from({length: 64}, (_, index) => index);
const URL = 'https://example.com/archive.pmtiles';

test('RangeRequestSource coalesces sibling reads from one source', async t => {
  const requestedRanges: string[] = [];
  const source = new RangeRequestSource(URL, {
    batchDelayMs: 0,
    rangeExpansionBytes: 8,
    fetch: async (_url, options) => {
      const range = new Headers(options?.headers).get('Range');
      requestedRanges.push(range || '');
      return createRangeResponse(range);
    }
  });

  const [first, second] = await Promise.all([source.getBytes(10, 4), source.getBytes(16, 4)]);

  t.deepEqual(requestedRanges, ['bytes=10-19'], 'uses one merged HTTP request');
  t.deepEqual(Array.from(new Uint8Array(first.data)), [10, 11, 12, 13], 'returns first slice');
  t.deepEqual(Array.from(new Uint8Array(second.data)), [16, 17, 18, 19], 'returns second slice');
  t.end();
});

test('RangeRequestSource keeps distinct source contexts isolated', async t => {
  const firstRanges: string[] = [];
  const secondRanges: string[] = [];
  const firstSource = new RangeRequestSource(URL, {
    batchDelayMs: 0,
    fetch: makeFetch(firstRanges)
  });
  const secondSource = new RangeRequestSource(URL, {
    batchDelayMs: 0,
    fetch: makeFetch(secondRanges)
  });

  const [first, second] = await Promise.all([
    firstSource.getBytes(2, 2),
    secondSource.getBytes(6, 2)
  ]);

  t.deepEqual(firstRanges, ['bytes=2-3'], 'uses the first source transport');
  t.deepEqual(secondRanges, ['bytes=6-7'], 'uses the second source transport');
  t.deepEqual(Array.from(new Uint8Array(first.data)), [2, 3], 'returns first source bytes');
  t.deepEqual(Array.from(new Uint8Array(second.data)), [6, 7], 'returns second source bytes');
  t.end();
});

function makeFetch(requestedRanges: string[]) {
  return async (_url: string, options?: RequestInit): Promise<Response> => {
    const range = new Headers(options?.headers).get('Range');
    requestedRanges.push(range || '');
    return createRangeResponse(range);
  };
}

function createRangeResponse(range: string | null): Response {
  const match = range?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid test Range header: ${range}`);
  }
  const offset = Number(match[1]);
  const endOffset = Number(match[2]);
  return new Response(BYTES.slice(offset, endOffset + 1), {
    status: 206,
    headers: {'Content-Range': `bytes ${offset}-${endOffset}/${BYTES.byteLength}`}
  });
}
