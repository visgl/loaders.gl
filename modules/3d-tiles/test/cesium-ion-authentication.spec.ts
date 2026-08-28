// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createAuthenticatedFetch, type FetchLike} from '@loaders.gl/loader-utils';
import {load} from '@loaders.gl/core';
import {
  CesiumIonLoader,
  _getIonTilesetMetadata as getIonTilesetMetadata
} from '@loaders.gl/3d-tiles';

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
});
