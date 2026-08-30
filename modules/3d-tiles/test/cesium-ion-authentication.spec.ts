// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {createAuthenticatedFetch, type FetchLike} from '@loaders.gl/loader-utils';
import {load} from '@loaders.gl/core';
import {
  CesiumIonLoader,
  _getIonTilesetMetadata as getIonTilesetMetadata
} from '@loaders.gl/3d-tiles';
import {CesiumIonLoaderWithParser} from '../src/cesium-ion-loader-with-parser';

afterEach(() => vi.unstubAllGlobals());

describe('Cesium ion authentication', () => {
  test('scopes the account token and derived endpoint token to their exact origins', async () => {
    const requests: Array<{url: string; authorization: string | null}> = [];
    const fetchFunction: FetchLike = async (url, options) => {
      requests.push({
        url,
        authorization: new Headers(options?.headers).get('authorization')
      });
      if (url.endsWith('/endpoint')) {
        return Response.json({
          type: '3DTILES',
          url: 'https://assets.cesium.com/123/tileset.json',
          accessToken: 'endpoint-token'
        });
      }
      return Response.json({id: 123, type: '3DTILES'});
    };

    const metadata = await getIonTilesetMetadata('account-token', 123, {fetch: fetchFunction});
    expect(requests).toEqual([
      {
        url: 'https://api.cesium.com/v1/assets/123',
        authorization: 'Bearer account-token'
      },
      {
        url: 'https://api.cesium.com/v1/assets/123/endpoint',
        authorization: 'Bearer account-token'
      }
    ]);

    const endpointFetch = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: metadata.credentials
    });
    await endpointFetch(metadata.url);
    await endpointFetch('https://example.com/tileset.json');

    expect(requests.slice(2)).toEqual([
      {
        url: 'https://assets.cesium.com/123/tileset.json',
        authorization: 'Bearer endpoint-token'
      },
      {url: 'https://example.com/tileset.json', authorization: null}
    ]);
  });

  test('loads an ion asset through bootstrap with the public metadata loader', async () => {
    const requestedURLs: string[] = [];
    const fetchFunction: FetchLike = async url => {
      requestedURLs.push(url);
      if (url.endsWith('/endpoint')) {
        return Response.json({
          type: '3DTILES',
          url: 'https://assets.cesium.com/123/tileset.json',
          accessToken: 'endpoint-token'
        });
      }
      if (url === 'https://api.cesium.com/v1/assets/123') {
        return Response.json({id: 123, type: '3DTILES'});
      }
      return Response.json({
        asset: {version: '1.1'},
        geometricError: 1,
        root: {
          boundingVolume: {sphere: [0, 0, 0, 1]},
          geometricError: 0,
          refine: 'ADD'
        }
      });
    };

    const tileset = await load('https://assets.cesium.com/123/tileset.json', CesiumIonLoader, {
      core: {fetch: fetchFunction},
      'cesium-ion': {accessToken: 'account-token', assetId: 123}
    });

    expect(tileset).toMatchObject({
      shape: 'tileset3d',
      url: 'https://assets.cesium.com/123/tileset.json'
    });
    expect(requestedURLs).toEqual([
      'https://api.cesium.com/v1/assets/123',
      'https://api.cesium.com/v1/assets/123/endpoint',
      'https://assets.cesium.com/123/tileset.json'
    ]);
  });

  test('infers asset ids and reports bootstrap failures', async () => {
    const onError = vi.fn();
    const fetchFunction = vi.fn(async () => {
      throw new Error('bootstrap failed');
    });

    await expect(
      CesiumIonLoaderWithParser.preload('https://assets.cesium.com/456/tileset.json', {
        fetch: fetchFunction,
        'cesium-ion': {onError}
      })
    ).rejects.toThrow('bootstrap failed');

    expect(fetchFunction).toHaveBeenCalledWith('https://api.cesium.com/v1/assets/456');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({message: 'bootstrap failed'}));
  });

  test('merges static fetch defaults and rejects failed asset responses', async () => {
    const requests: Array<{url: string; headers: Headers}> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | Request, options?: RequestInit) => {
        const url =
          typeof input === 'string' ? input : String(input instanceof Request ? input.url : input);
        const headers = new Headers(typeof input === 'string' ? options?.headers : input.headers);
        requests.push({url, headers});
        if (url.endsWith('/endpoint')) {
          return Response.json({
            type: '3DTILES',
            url: 'https://assets.cesium.com/789/tileset.json',
            accessToken: 'endpoint-token'
          });
        }
        if (url.includes('/v1/assets/789')) return Response.json({id: 789, type: '3DTILES'});
        return new Response(null, {status: 503, statusText: ''});
      })
    );

    await expect(
      CesiumIonLoaderWithParser.parseUrl('https://assets.cesium.com/789/tileset.json', {
        fetch: {headers: {'X-Default': 'yes'}},
        'cesium-ion': {accessToken: 'account-token'}
      })
    ).rejects.toThrow('Cesium ion asset request failed: 503');

    expect(requests[0].headers.get('x-default')).toBe('yes');
    expect(requests[0].headers.get('authorization')).toBe('Bearer account-token');
  });

  test('parses tileset bytes through the parser-bearing loader', async () => {
    const data = new TextEncoder().encode(
      JSON.stringify({
        asset: {version: '1.1'},
        geometricError: 1,
        root: {
          boundingVolume: {sphere: [0, 0, 0, 1]},
          geometricError: 0,
          refine: 'ADD'
        }
      })
    );

    await expect(
      CesiumIonLoaderWithParser.parse(data.buffer, {'cesium-ion': {assetId: 1}})
    ).resolves.toMatchObject({shape: 'tileset3d'});
  });
});
