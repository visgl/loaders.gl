// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {RangeRequestSource} from '../src/lib/range-request-source';

const BYTES = Uint8Array.from({length: 64}, (_, index) => index);
const URL = 'https://example.com/archive.pmtiles';

test('RangeRequestSource coalesces sibling reads from one source', async () => {
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

  expect(requestedRanges).toEqual(['bytes=10-19']);
  expect(Array.from(new Uint8Array(first.data))).toEqual([10, 11, 12, 13]);
  expect(Array.from(new Uint8Array(second.data))).toEqual([16, 17, 18, 19]);
});

test('RangeRequestSource keeps distinct source contexts isolated', async () => {
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

  expect(firstRanges).toEqual(['bytes=2-3']);
  expect(secondRanges).toEqual(['bytes=6-7']);
  expect(Array.from(new Uint8Array(first.data))).toEqual([2, 3]);
  expect(Array.from(new Uint8Array(second.data))).toEqual([6, 7]);
});

test('RangeRequestSource exposes its archive URL as the source key', () => {
  const source = new RangeRequestSource(URL);

  expect(source.getKey()).toBe(URL);
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
