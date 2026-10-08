// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createTileConversionResourceFetcher} from '@loaders.gl/tile-converter/v5/adapters';

test('external resources share one budget across parallel reads and previously inspected bytes', async () => {
  const fetcher = createTileConversionResourceFetcher({
    maxInputBytes: 10,
    initialInputBytes: 2,
    fetcher: vi.fn(async () => new Response(new Uint8Array(4)))
  });
  expect(await (await fetcher('https://example.invalid/first')).arrayBuffer()).toHaveProperty(
    'byteLength',
    4
  );
  expect(await (await fetcher('https://example.invalid/second')).arrayBuffer()).toHaveProperty(
    'byteLength',
    4
  );
  await expect(fetcher('https://example.invalid/third')).rejects.toMatchObject({
    code: 'INPUT_RESOURCE_TOO_LARGE'
  });
  const concurrent = createTileConversionResourceFetcher({
    maxInputBytes: 7,
    fetcher: async () => new Response(new Uint8Array(4))
  });
  const results = await Promise.allSettled([
    concurrent('https://example.invalid/a'),
    concurrent('https://example.invalid/b')
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
});

test('over-budget streams are canceled, requests retain options, and conversion abort is forwarded', async () => {
  const cancel = vi.fn();
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(5));
          },
          cancel
        })
      )
  );
  const controller = new AbortController();
  const request = createTileConversionResourceFetcher({
    maxInputBytes: 4,
    signal: controller.signal,
    fetcher
  });
  await expect(
    request('https://example.invalid/a', {headers: {'x-test': 'value'}})
  ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
  expect(cancel).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0][1]!.headers).toEqual({'x-test': 'value'});
  controller.abort(new Error('stop conversion'));
  await expect(request('https://example.invalid/b')).rejects.toThrow(/stop conversion/);
  expect(fetcher).toHaveBeenCalledOnce();
});

test('transport rejects invalid configuration, protocols and HTTP failures', async () => {
  expect(() => createTileConversionResourceFetcher({maxInputBytes: 0})).toThrow();
  expect(() =>
    createTileConversionResourceFetcher({maxInputBytes: 4, initialInputBytes: 5})
  ).toThrow();
  const request = createTileConversionResourceFetcher({
    maxInputBytes: 4,
    fetcher: async () => new Response('missing', {status: 404})
  });
  await expect(request('file:///private/data')).rejects.toMatchObject({
    code: 'EXTERNAL_RESOURCE_UNSUPPORTED'
  });
  await expect(request('https://example.invalid/a')).rejects.toMatchObject({
    code: 'BROWSER_SOURCE_FETCH_FAILED'
  });
});

/** Cancellation must release a pending body even when an application transport ignores signals. */
test('conversion abort cancels a pending dependency stream', async () => {
  const cancel = vi.fn();
  const controller = new AbortController();
  const request = createTileConversionResourceFetcher({
    maxInputBytes: 4,
    signal: controller.signal,
    fetcher: async () => new Response(new ReadableStream({cancel}))
  });
  const pending = request('https://example.invalid/pending');
  const rejection = expect(pending).rejects.toThrow(/stop pending read/);
  await Promise.resolve();
  controller.abort(new Error('stop pending read'));
  await rejection;
  expect(cancel).toHaveBeenCalledOnce();
});
