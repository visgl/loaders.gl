// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {
  BearerTokenAuthentication,
  createAuthenticatedFetch,
  type FetchLike
} from '@loaders.gl/core/loader-utils';
import {coreApi, load} from '@loaders.gl/core';
import {resolveCesiumIonTileset} from '../../src/3d-tiles/lib/ion/ion';
import {Tiles3DLoader, Tiles3DSource} from '@loaders.gl/tiles-3d/3d-tiles/bundled';

import {Tileset3D, type Tile3D} from '@loaders.gl/tiles-3d/tileset';

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

  test('shares declarative authentication between root and child requests', async () => {
    const origin = 'https://assets.ion.cesium.com';
    const rootUrl = `${origin}/123/tileset.json`;
    const childUrl = `${origin}/123/child.json`;
    const constructCredential = vi.fn();
    class TestAuthentication extends BearerTokenAuthentication {
      constructor(options: ConstructorParameters<typeof BearerTokenAuthentication>[0]) {
        super(options);
        constructCredential();
      }
    }
    const fetchFunction = vi.fn(async (_url: string, options?: RequestInit) => {
      expect(new Headers(options?.headers).get('authorization')).toBe('Bearer endpoint-token');
      return Response.json({
        asset: {version: '1.1'},
        geometricError: 1,
        root: {boundingVolume: {sphere: [0, 0, 0, 1]}, geometricError: 0, refine: 'ADD'}
      });
    });
    const source = new Tiles3DSource(
      {url: rootUrl, loader: Tiles3DLoader, coreApi},
      {
        core: {
          fetch: fetchFunction,
          authentications: [TestAuthentication],
          credentials: [
            {type: 'bearer-token', id: 'test-asset', origins: [origin], token: 'endpoint-token'}
          ]
        }
      }
    );

    await source.initialize();
    const tile = await source.loadTileContent({contentUrls: [childUrl]} as Tile3D);

    expect(tile.nestedTileset).toBeDefined();
    expect(fetchFunction.mock.calls.map(([url]) => url)).toEqual([rootUrl, childUrl]);
    expect(constructCredential).toHaveBeenCalledTimes(1);
  });

  test('exposes a preloaded root while concurrent child requests share credential discovery', async () => {
    const origin = 'https://example.com';
    const rootUrl = `${origin}/tileset.json`;
    const json = {
      asset: {version: '1.1'},
      geometricError: 1,
      root: {boundingVolume: {sphere: [0, 0, 0, 1]}, geometricError: 0, refine: 'ADD'}
    };
    const parsed = await load(rootUrl, Tiles3DLoader, {
      core: {fetch: async () => Response.json(json)}
    });
    let finishDiscovery!: () => void;
    const discovery = new Promise<void>(resolve => {
      finishDiscovery = resolve;
    });
    const getAuthentications = vi.fn(async () => {
      await discovery;
      return [BearerTokenAuthentication];
    });
    const fetch = vi.fn(async (_url: string, options?: RequestInit) => {
      expect(new Headers(options?.headers).get('authorization')).toBe('Bearer shared');
      return Response.json(json);
    });
    const source = new Tiles3DSource(
      {...parsed, loader: {...Tiles3DLoader, getAuthentications}, coreApi},
      {
        core: {
          fetch,
          credentials: [{type: 'bearer-token', id: 'test', origins: [origin], token: 'shared'}]
        }
      }
    );
    const tileset = new Tileset3D(source);
    try {
      expect(tileset.root).toBeTruthy();
      expect(getAuthentications).not.toHaveBeenCalled();
      const children = ['first.json', 'second.json'].map(name =>
        source.loadTileContent({contentUrls: [`${origin}/${name}`]} as Tile3D)
      );
      expect(getAuthentications).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
      finishDiscovery();
      await Promise.all(children);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(getAuthentications).toHaveBeenCalledTimes(1);
    } finally {
      finishDiscovery();
      await tileset.tilesetInitializationPromise;
      tileset.destroy();
    }
  });

  test('refreshes the endpoint credential for child requests without exposing it to other origins', async () => {
    let endpointRequests = 0;
    const authorizations: Array<string | null> = [];
    const fetchFunction: FetchLike = async (url, options) => {
      if (url.startsWith('https://api.cesium.com/')) {
        if (!url.endsWith('/endpoint')) return Response.json({type: '3DTILES'});
        endpointRequests++;
        return Response.json({
          url: 'https://example.com/custom/root.json?version=1',
          accessToken: `token-${endpointRequests}`
        });
      }
      const authorization = new Headers(options?.headers).get('authorization');
      authorizations.push(authorization);
      return new Response(null, {status: authorization === 'Bearer token-1' ? 401 : 200});
    };
    const endpoint = await resolveCesiumIonTileset('account-token', 123, {fetch: fetchFunction});
    const fetchAsset = createAuthenticatedFetch({
      fetch: fetchFunction,
      credentials: endpoint.credentials
    });
    expect(endpoint.url).toBe('https://example.com/custom/root.json?version=1');
    expect((await fetchAsset(new URL('child.json', endpoint.url).href)).ok).toBe(true);
    expect((await fetchAsset(new URL('tile.b3dm', endpoint.url).href)).ok).toBe(true);
    await fetchAsset('https://other.example.com/tile.b3dm');
    expect(authorizations).toEqual(['Bearer token-1', 'Bearer token-2', 'Bearer token-2', null]);
    expect(endpointRequests).toBe(2);
  });
});
