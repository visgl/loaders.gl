// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createBearerTokenCredential} from '@loaders.gl/loader-utils';
import {getFetchFunction} from '../../../src/lib/loader-utils/get-fetch-function';

describe('getFetchFunction', () => {
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
