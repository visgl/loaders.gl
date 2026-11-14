// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {createAuthenticatedFetch, type FetchLike} from '@loaders.gl/core/loader-utils';
import {load} from '@loaders.gl/core';
import {resolveCesiumIonTileset, Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';

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

    const metadata = await resolveCesiumIonTileset('account-token', 123, {fetch: fetchFunction});
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

    const endpoint = await resolveCesiumIonTileset('account-token', 123, {fetch: fetchFunction});
    const tileset = await load(endpoint.url, Tiles3DLoader, {
      core: {fetch: fetchFunction, credentials: endpoint.credentials}
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
});
