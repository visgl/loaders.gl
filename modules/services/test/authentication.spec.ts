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
});
