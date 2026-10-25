// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {createBearerTokenCredential} from '@loaders.gl/core/loader-utils';
import {load, NullLoader, parse, parseInBatches} from '@loaders.gl/core';
import {getFetchFunction} from '../../../src/lib/loader-utils/get-fetch-function';
import {getLoaderContext} from '../../../src/lib/loader-utils/loader-context';

describe('getFetchFunction', () => {
  test('applies fetch options to a parent fetch implementation', async () => {
    const abortController = new AbortController();
    const requests: Array<{url: string; signal?: AbortSignal}> = [];
    const parentFetch = async (url: string, options?: RequestInit) => {
      requests.push({url, signal: options?.signal});
      return new Response('ok');
    };
    const fetchFunction = getFetchFunction({core: {fetch: {signal: abortController.signal}}}, {
      fetch: parentFetch
    } as any);

    await fetchFunction('asset');

    expect(requests).toEqual([{url: 'asset', signal: abortController.signal}]);
  });

  test('preserves fetch options when creating a subloader context', async () => {
    const abortController = new AbortController();
    const requests: Array<{url: string; signal?: AbortSignal}> = [];
    const parentFetch = async (url: string, options?: RequestInit) => {
      requests.push({url, signal: options?.signal});
      return new Response('ok');
    };
    const parentContext = {
      fetch: parentFetch,
      coreApi: {} as any,
      _parse: async () => null
    } as any;
    const childContext = getLoaderContext(
      {url: 'root.gltf'},
      {core: {fetch: {signal: abortController.signal}}},
      parentContext
    );

    await childContext.fetch('asset');

    expect(requests).toEqual([{url: 'asset', signal: abortController.signal}]);
  });

  test('composes core credentials with custom fetch options', async () => {
    const requests: Array<{url: string; headers: Headers}> = [];
    const fetchFunction = getFetchFunction({
      core: {
        fetch: async (url, options) => {
          requests.push({url, headers: new Headers(options?.headers)});
          return new Response('ok');
        },
        credentials: [
          createBearerTokenCredential({
            id: 'private-api',
            origins: ['https://example.com'],
            token: 'secret'
          })
        ]
      }
    });

    await fetchFunction('https://example.com/data', {headers: {Accept: 'application/json'}});

    expect(requests[0].url).toBe('https://example.com/data');
    expect(requests[0].headers.get('authorization')).toBe('Bearer secret');
    expect(requests[0].headers.get('accept')).toBe('application/json');
  });
});

test('top-level cancellation and progress propagate to nested loader context and fetch', async () => {
  const controller = new AbortController();
  const progress = () => {};
  let receivedSignal: AbortSignal | null | undefined;
  const parent = getLoaderContext(
    {
      fetch: async (_url, init) => {
        receivedSignal = init?.signal;
        return new Response('ok');
      }
    },
    {signal: controller.signal, onProgress: progress},
    null
  );
  const nested = getLoaderContext({}, {}, parent);
  await nested.fetch('asset');
  expect(nested.signal).toBe(controller.signal);
  expect(nested.reportProgress).toBe(progress);
  expect(receivedSignal).toBe(controller.signal);
});

test.each([
  parse,
  parseInBatches
])('already aborted loader calls reject before awaiting input: %s', async parseInput => {
  const controller = new AbortController();
  controller.abort('already cancelled');
  const then = vi.fn();
  const input = {then} as unknown as Promise<ArrayBuffer>;
  await expect(parseInput(input, {signal: controller.signal})).rejects.toBe('already cancelled');
  expect(then).not.toHaveBeenCalled();
});

test('cancellable nested fetches authenticate once and retain the request signal', async () => {
  const controller = new AbortController();
  const authenticate = vi.fn(({url, options}: {url: string; options: RequestInit}) => ({
    url,
    options
  }));
  const transport = vi.fn(async (_url: string, _options?: RequestInit) => new Response('ok'));
  const credentials = [
    {id: 'signer', type: 'request' as const, origins: ['https://example.com'], authenticate}
  ];
  const parent = getFetchFunction({
    signal: controller.signal,
    core: {fetch: transport, credentials}
  });
  const child = getFetchFunction({signal: controller.signal, core: {credentials}}, {
    fetch: parent
  } as any);

  await child('https://example.com/data');

  expect(authenticate).toHaveBeenCalledOnce();
  expect(transport).toHaveBeenCalledOnce();
  expect(transport.mock.calls[0][1]?.signal).toBe(controller.signal);
});

test('load and nested context fetch preserve the caller abort reason', async () => {
  const controller = new AbortController();
  const abortReason = new Error('cancel loading');
  controller.abort(abortReason);
  const transport = vi.fn(async () => new Response('ok'));
  const options = {signal: controller.signal, core: {fetch: transport}};
  await expect(load('/data.null', NullLoader, options)).rejects.toBe(abortReason);
  const parent = getLoaderContext({_parse: async () => null}, options, null);
  const child = getLoaderContext({}, {}, parent);
  await expect(child.fetch('/nested')).rejects.toBe(abortReason);
  expect(transport).not.toHaveBeenCalled();
});
