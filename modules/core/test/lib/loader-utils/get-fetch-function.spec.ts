// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createBearerTokenCredential} from '@loaders.gl/loader-utils';
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
