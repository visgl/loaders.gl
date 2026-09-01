// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  createAuthenticatedFetch,
  createBearerTokenCredential,
  createQueryParameterCredential,
  getAuthenticatedFetch,
  redactCredentialURL
} from '@loaders.gl/loader-utils';

describe('request credentials', () => {
  test('applies query credentials only to exact origins and preserves request headers', async () => {
    const requests: Array<{url: string; headers: Headers}> = [];
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: async (url, options) => {
        requests.push({url, headers: new Headers(options?.headers)});
        return new Response('ok');
      },
      credentials: [
        createQueryParameterCredential({
          id: 'test-key',
          origins: ['https://tiles.example.com'],
          parameterName: 'key',
          token: 'secret'
        })
      ]
    });

    await authenticatedFetch('https://tiles.example.com/data?session=abc', {
      headers: {Accept: 'application/json'}
    });
    await authenticatedFetch('https://other.example.com/data');

    expect(requests[0].url).toBe('https://tiles.example.com/data?session=abc&key=secret');
    expect(requests[0].headers.get('accept')).toBe('application/json');
    expect(requests[1].url).toBe('https://other.example.com/data');
  });

  test('preserves explicit query and header credentials', async () => {
    const requests: Array<{url: string; authorization: string | null}> = [];
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: async (url, options) => {
        requests.push({
          url,
          authorization: new Headers(options?.headers).get('authorization')
        });
        return new Response('ok');
      },
      credentials: [
        createQueryParameterCredential({
          id: 'query',
          origins: ['https://example.com'],
          parameterName: 'token',
          token: 'configured-query'
        }),
        createBearerTokenCredential({
          id: 'bearer',
          origins: ['https://example.com'],
          token: 'configured-header'
        })
      ]
    });

    await authenticatedFetch('https://example.com/data?token=explicit-query', {
      headers: {Authorization: 'Bearer explicit-header'}
    });

    expect(requests).toEqual([
      {
        url: 'https://example.com/data?token=explicit-query',
        authorization: 'Bearer explicit-header'
      }
    ]);
  });

  test('builds an authenticated fetch function from loader options', async () => {
    const requests: Array<{authorization: string | null; accept: string | null}> = [];
    const authenticatedFetch = getAuthenticatedFetch({
      core: {
        fetch: async (_url, options) => {
          const headers = new Headers(options?.headers);
          requests.push({
            authorization: headers.get('authorization'),
            accept: headers.get('accept')
          });
          return new Response('ok');
        },
        credentials: [
          createBearerTokenCredential({
            id: 'source-token',
            origins: ['https://example.com'],
            token: 'secret'
          })
        ]
      }
    });

    await authenticatedFetch('https://example.com/data', {
      headers: {Accept: 'application/json'}
    });

    expect(requests).toEqual([{authorization: 'Bearer secret', accept: 'application/json'}]);
  });

  test('refreshes an asynchronous credential and replays once', async () => {
    const reasons: string[] = [];
    const requestedTokens: (string | null)[] = [];
    const credential = createBearerTokenCredential({
      id: 'refreshing-bearer',
      origins: ['https://example.com'],
      token: context => {
        reasons.push(context.reason);
        return context.reason === 'refresh' ? 'fresh' : 'expired';
      }
    });
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: async (_url, options) => {
        const token = new Headers(options?.headers).get('authorization');
        requestedTokens.push(token);
        return new Response('', {status: token === 'Bearer fresh' ? 200 : 401});
      },
      credentials: [credential]
    });

    const response = await authenticatedFetch('https://example.com/data');

    expect(response.status).toBe(200);
    expect(reasons).toEqual(['request', 'refresh']);
    expect(requestedTokens).toEqual(['Bearer expired', 'Bearer fresh']);
  });

  test('deduplicates concurrent refresh callbacks', async () => {
    let releaseRefresh: (token: string) => void = () => {};
    const refreshToken = new Promise<string>(resolve => {
      releaseRefresh = resolve;
    });
    const tokenProvider = vi.fn(async ({reason}: {reason: string}) =>
      reason === 'refresh' ? refreshToken : 'expired'
    );
    const credential = createBearerTokenCredential({
      id: 'shared-refresh',
      origins: ['https://example.com'],
      token: tokenProvider
    });
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: async (_url, options) =>
        new Response('', {
          status:
            new Headers(options?.headers).get('authorization') === 'Bearer refreshed' ? 200 : 401
        }),
      credentials: [credential]
    });

    const firstRequest = authenticatedFetch('https://example.com/first');
    const secondRequest = authenticatedFetch('https://example.com/second');
    await vi.waitFor(() =>
      expect(
        tokenProvider.mock.calls.filter(([context]) => context.reason === 'refresh')
      ).toHaveLength(1)
    );
    releaseRefresh('refreshed');

    expect((await firstRequest).status).toBe(200);
    expect((await secondRequest).status).toBe(200);
  });

  test('does not replay non-idempotent requests', async () => {
    const tokenProvider = vi.fn(() => 'expired');
    const fetch = vi.fn(async () => new Response('', {status: 401}));
    const authenticatedFetch = createAuthenticatedFetch({
      fetch,
      credentials: [
        createBearerTokenCredential({
          id: 'post-token',
          origins: ['https://example.com'],
          token: tokenProvider
        })
      ]
    });

    const response = await authenticatedFetch('https://example.com/data', {method: 'POST'});

    expect(response.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(tokenProvider).toHaveBeenCalledTimes(1);
  });

  test('redacts configured query credentials from diagnostic URLs', () => {
    const credential = createQueryParameterCredential({
      id: 'private-token',
      origins: ['https://example.com'],
      parameterName: 'token',
      token: 'secret'
    });

    expect(redactCredentialURL('https://example.com/data?token=secret&f=json', [credential])).toBe(
      'https://example.com/data?token=%5BREDACTED%5D&f=json'
    );
  });

  test('rejects origins containing paths or query parameters', () => {
    expect(() =>
      createQueryParameterCredential({
        id: 'invalid-origin',
        origins: ['https://example.com/private'],
        parameterName: 'token',
        token: 'secret'
      })
    ).toThrow(/only scheme, host, and port/);
  });
});
