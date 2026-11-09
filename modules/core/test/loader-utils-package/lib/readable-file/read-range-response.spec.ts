// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {readRangeResponse} from '@loaders.gl/core/loader-utils';

test.each([null, 'bytes 2-4/10', 'bytes 2-4/*'])('exact range accepts metadata %s', async value => {
  const response = new Response(new Uint8Array([2, 3, 4]), {
    status: 206,
    headers: value === null ? {} : {'Content-Range': value}
  });
  expect(await readRangeResponse(response, 2, 3)).toEqual(new Uint8Array([2, 3, 4]));
});
test.each([
  '',
  'bad',
  'bytes 0-2/10',
  'bytes 2-4/4'
])('range rejects visible invalid metadata %s', async value => {
  await expect(
    readRangeResponse(
      new Response(new Uint8Array(3), {status: 206, headers: {'Content-Range': value}}),
      2,
      3
    )
  ).rejects.toThrow(/Content-Range/);
});
test.each([2, 4])('range rejects wrong body length %s', async length => {
  await expect(
    readRangeResponse(new Response(new Uint8Array(length), {status: 206}), 2, 3)
  ).rejects.toThrow(/length/);
});
test('range rejects full response and cancels overflow', async () => {
  await expect(readRangeResponse(new Response(new Uint8Array(3)), 2, 3)).rejects.toThrow(/206/);
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(4));
    },
    cancel() {
      cancelled = true;
    }
  });
  await expect(readRangeResponse(new Response(body, {status: 206}), 2, 3)).rejects.toThrow(
    /exceeds/
  );
  expect(cancelled).toBe(true);
});
test('range supports bigint offsets and cancellation', async () => {
  const offset = 9007199254740993n;
  expect(
    (
      await readRangeResponse(
        new Response(new Uint8Array(1), {
          status: 206,
          headers: {'Content-Range': `bytes ${offset}-${offset}/*`}
        }),
        offset,
        1
      )
    ).length
  ).toBe(1);
  const controller = new AbortController();
  controller.abort();
  await expect(
    readRangeResponse(new Response(new Uint8Array(1), {status: 206}), 0, 1, controller.signal)
  ).rejects.toThrow();
});
