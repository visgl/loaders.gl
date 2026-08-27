// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {validateLoader} from 'test/common/conformance';
import {MapStyleLoader} from '@loaders.gl/mvt/bundled';
import inlineStyleText from './data/map-style/inline.style.json?raw';
import {resolveMapStyle, type MapStyle, type MapStyleLoadOptions} from '../src/index';
const INLINE_STYLE_URL = new URL('./data/map-style/inline.style.json', import.meta.url);
const STYLE_BASE_URL = 'https://example.com/styles/root.style.json';
const TILEJSON_URL = 'https://example.com/styles/terrain.tilejson';
const TILE_TEMPLATE_URL = 'https://example.com/styles/tiles/{z}/{x}/{y}.pbf';
function createJsonResponse(json: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return json;
    }
  };
}
test('MapStyleLoader#loader conformance', () => {
  validateLoader(MapStyleLoader, 'MapStyleLoader');
});
test('MapStyleLoader#parse inline style fixture', async () => {
  const style = await parse(inlineStyleText, MapStyleLoader, {
    mapStyle: {baseUrl: INLINE_STYLE_URL.href}
  });
  expect(style.version, 'style version is preserved').toBe(8);
  expect(style.layers.length, 'style layers are loaded').toBe(1);
  expect(style.sources['inline-source']?.type, 'source metadata is preserved').toBe('vector');
  expect(
    style.sources['inline-source']?.tiles?.[0]?.includes('/tiles/{z}/{x}/{y}.mvt'),
    'relative tile template is normalized'
  ).toBe(true);
  expect(style.sources['inline-source']?.custom, 'unknown source fields are preserved').toEqual({
    preserved: true
  });
});
test('MapStyleLoader#parseText inline style fixture', async () => {
  const style = await MapStyleLoader.parseText?.(inlineStyleText, {
    mapStyle: {baseUrl: INLINE_STYLE_URL.href}
  });
  expect(style, 'parseText returns a resolved style').toBeTruthy();
  expect(style?.version, 'style version is preserved').toBe(8);
  expect(style?.sources['inline-source']?.type, 'source metadata is preserved').toBe('vector');
});
test('resolveMapStyle resolves relative tiles from baseUrl', async () => {
  const style: MapStyle = {
    version: 8,
    sources: {
      basemap: {
        type: 'vector',
        tiles: ['./tiles/{z}/{x}/{y}.mvt']
      }
    },
    layers: [{id: 'land', type: 'fill', source: 'basemap'}]
  };
  const resolvedStyle = await resolveMapStyle(style, {
    mapStyle: {baseUrl: STYLE_BASE_URL}
  });
  expect(
    resolvedStyle.sources.basemap.tiles?.[0],
    'tile template is resolved against baseUrl'
  ).toBe('https://example.com/styles/tiles/{z}/{x}/{y}.mvt');
});
test('resolveMapStyle resolves TileJSON-backed sources', async () => {
  let requestedUrl = '';
  const resolvedStyle = await resolveMapStyle(
    {
      version: 8,
      sources: {
        terrain: {
          type: 'vector',
          url: './terrain.tilejson',
          attribution: 'kept'
        }
      },
      layers: [{id: 'terrain-fill', type: 'fill', source: 'terrain'}]
    },
    {
      mapStyle: {
        baseUrl: STYLE_BASE_URL,
        fetch: async url => {
          requestedUrl = String(url);
          return createJsonResponse({
            tiles: ['./tiles/{z}/{x}/{y}.pbf'],
            minzoom: 2,
            maxzoom: 14,
            name: 'Terrain tiles'
          }) as Response;
        }
      }
    }
  );
  expect(requestedUrl, 'relative TileJSON URL is resolved before fetch').toBe(TILEJSON_URL);
  expect(resolvedStyle.sources.terrain.url, 'resolved source URL is stored').toBe(TILEJSON_URL);
  expect(
    resolvedStyle.sources.terrain.tiles?.[0],
    'TileJSON tiles are resolved against the TileJSON URL'
  ).toBe(TILE_TEMPLATE_URL);
  expect(resolvedStyle.sources.terrain.minzoom, 'TileJSON fields are merged').toBe(2);
  expect(resolvedStyle.sources.terrain.attribution, 'existing source fields are preserved').toBe(
    'kept'
  );
});
test('MapStyleLoader honors custom fetch implementation', async () => {
  const arrayBuffer = new TextEncoder().encode(
    JSON.stringify({
      version: 8,
      sources: {
        basemap: {
          type: 'vector',
          url: './terrain.tilejson'
        }
      },
      layers: [{id: 'water', type: 'fill', source: 'basemap'}]
    })
  ).buffer;
  const requestedUrls: string[] = [];
  const options: MapStyleLoadOptions = {
    mapStyle: {
      baseUrl: STYLE_BASE_URL,
      fetch: async url => {
        requestedUrls.push(String(url));
        return createJsonResponse({tiles: ['./tiles/{z}/{x}/{y}.mvt']}) as Response;
      }
    }
  };
  const style = await parse(arrayBuffer, MapStyleLoader, options);
  expect(requestedUrls, 'custom fetch is used for source resolution').toEqual([TILEJSON_URL]);
  expect(style.sources.basemap.tiles?.[0]).toBe('https://example.com/styles/tiles/{z}/{x}/{y}.mvt');
});
test('resolveMapStyle preserves extra fields and initializes empty collections', async () => {
  const style = await resolveMapStyle({
    version: 8,
    metadata: {theme: 'test'},
    custom: {enabled: true}
  });
  expect(style.sources, 'sources default to an empty object').toEqual({});
  expect(style.layers, 'layers default to an empty array').toEqual([]);
  expect(style.custom, 'extra top-level fields are preserved').toEqual({enabled: true});
});
test('MapStyleLoader rejects invalid JSON', async () => {
  await expect(
    MapStyleLoader.parse(new TextEncoder().encode('{"version":8').buffer, {}),
    'invalid JSON is rejected'
  ).rejects.toThrow(/JSON/);
});
test('resolveMapStyle rejects invalid fetched TileJSON', async () => {
  await expect(
    resolveMapStyle(
      {
        version: 8,
        sources: {
          basemap: {
            type: 'vector',
            url: './terrain.tilejson'
          }
        }
      },
      {
        mapStyle: {
          baseUrl: STYLE_BASE_URL,
          fetch: async () => createJsonResponse('not-an-object') as Response
        }
      }
    ),
    'invalid fetched TileJSON is rejected'
  ).rejects.toThrow(/Invalid input/);
});
