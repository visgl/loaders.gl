// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createAuthenticatedFetch, type FetchLike} from '@loaders.gl/loader-utils';
import {
  createArcGISCredential,
  createCesiumIonCredential,
  createGoogleMapsCredential,
  createMapboxCredential
} from '@loaders.gl/services';

describe('service authentication presets', () => {
  test('uses provider-specific credential placement and origins', () => {
    expect(
      createArcGISCredential({token: 'arcgis', origins: ['https://enterprise.example.com']})
    ).toMatchObject({
      type: 'query-parameter',
      name: 'token',
      origins: ['https://enterprise.example.com'],
      refreshStatusCodes: [401, 403, 498, 499]
    });
    expect(createMapboxCredential({accessToken: 'mapbox'})).toMatchObject({
      type: 'query-parameter',
      name: 'access_token',
      origins: ['https://api.mapbox.com']
    });
    expect(createGoogleMapsCredential({apiKey: 'google'})).toMatchObject({
      type: 'query-parameter',
      name: 'key',
      origins: ['https://tile.googleapis.com']
    });
    expect(createCesiumIonCredential({accessToken: 'ion'})).toMatchObject({
      type: 'header',
      name: 'Authorization',
      prefix: 'Bearer ',
      origins: ['https://api.cesium.com']
    });
  });

  test('exchanges a Cesium ion account token through the standard auth pipeline', async () => {
    const requests: Array<{authorization: string | null; url: string}> = [];
    const fetchFunction: FetchLike = async (url, options) => {
      requests.push({
        authorization: new Headers(options?.headers).get('authorization'),
        url
      });
      return Response.json({
        accessToken: 'endpoint-token',
        url: 'https://assets.ion.cesium.com/123/tileset.json'
      });
    };
    const credential = createCesiumIonCredential({
      accessToken: 'account-token',
      assetId: 123,
      fetch: fetchFunction,
      tokenType: 'account'
    });
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: [credential]
    });

    await authenticatedFetch('https://assets.ion.cesium.com/123/tileset.json');

    expect(requests).toEqual([
      {
        authorization: 'Bearer account-token',
        url: 'https://api.cesium.com/v1/assets/123/endpoint'
      },
      {
        authorization: 'Bearer endpoint-token',
        url: 'https://assets.ion.cesium.com/123/tileset.json'
      }
    ]);
  });

  test('uses a legacy asset-scoped Cesium ion token without an API exchange', async () => {
    const encodedClaims = btoa(JSON.stringify({assets: [123]}))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const assetToken = `header.${encodedClaims}.signature`;
    const requests: Array<{authorization: string | null; url: string}> = [];
    const fetchFunction: FetchLike = async (url, options) => {
      requests.push({
        authorization: new Headers(options?.headers).get('authorization'),
        url
      });
      return Response.json({});
    };
    const credential = createCesiumIonCredential({accessToken: assetToken, assetId: 123});
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: [credential]
    });

    await authenticatedFetch('https://assets.ion.cesium.com/123/tileset.json');

    expect(requests).toEqual([
      {
        authorization: `Bearer ${assetToken}`,
        url: 'https://assets.ion.cesium.com/123/tileset.json'
      }
    ]);
  });

  test('supports explicit asset tokens and refreshes the token provider', async () => {
    const tokenContexts: Array<{reason: string; url: string}> = [];
    let requestCount = 0;
    const fetchFunction: FetchLike = async (_url, options) => {
      requestCount += 1;
      const authorization = new Headers(options?.headers).get('authorization');
      return new Response('', {
        status: requestCount === 1 ? 401 : 200,
        headers: {authorization: authorization || ''}
      });
    };
    const credential = createCesiumIonCredential({
      accessToken: context => {
        tokenContexts.push({reason: context.reason, url: context.url});
        return 'asset-token';
      },
      assetId: 'abc',
      origins: ['https://assets.example.com'],
      tokenType: 'asset'
    });
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: [credential]
    });

    const response = await authenticatedFetch('https://assets.example.com/abc/tileset.json');

    expect(response.status).toBe(200);
    expect(tokenContexts).toEqual([
      {
        reason: 'request',
        url: 'https://api.cesium.com/v1/assets/abc/endpoint'
      },
      {
        reason: 'refresh',
        url: 'https://api.cesium.com/v1/assets/abc/endpoint'
      }
    ]);
  });

  test.each([
    [
      'rejects failed endpoint requests',
      new Response('', {status: 503}),
      /endpoint request failed: 503/
    ],
    [
      'rejects endpoints outside the configured origins',
      Response.json({url: 'https://evil.example.com/tileset.json', accessToken: 'token'}),
      /unconfigured origin/
    ],
    [
      'rejects endpoints without an access token',
      Response.json({url: 'https://assets.ion.cesium.com/123/tileset.json'}),
      /did not return an endpoint token/
    ]
  ])('%s', async (_name, endpointResponse, error) => {
    const fetchFunction: FetchLike = async () => endpointResponse;
    const credential = createCesiumIonCredential({
      accessToken: 'account-token',
      assetId: 123,
      fetch: fetchFunction,
      tokenType: 'account'
    });
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: [credential]
    });

    await expect(
      authenticatedFetch('https://assets.ion.cesium.com/123/tileset.json')
    ).rejects.toThrow(error);
  });

  test('returns no token when an application provider is empty and falls back for malformed JWTs', async () => {
    const requests: Array<{authorization: string | null; url: string}> = [];
    const fetchFunction: FetchLike = async (url, options) => {
      requests.push({
        authorization: new Headers(options?.headers).get('authorization'),
        url
      });
      return Response.json({
        accessToken: 'endpoint-token',
        url: 'https://assets.ion.cesium.com/123/tileset.json'
      });
    };
    const emptyCredential = createCesiumIonCredential({
      accessToken: () => null,
      assetId: 123,
      fetch: fetchFunction,
      tokenType: 'asset'
    });
    const emptyFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: [emptyCredential]
    });
    await emptyFetch('https://assets.ion.cesium.com/123/tileset.json');
    expect(requests[0].authorization).toBeNull();

    requests.length = 0;
    const malformedCredential = createCesiumIonCredential({
      accessToken: 'header.!.signature',
      assetId: 123,
      fetch: fetchFunction,
      tokenType: 'auto'
    });
    const malformedFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: [malformedCredential]
    });
    await malformedFetch('https://assets.ion.cesium.com/123/tileset.json');
    expect(requests).toHaveLength(2);
  });
});
