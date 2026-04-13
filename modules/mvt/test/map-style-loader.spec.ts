// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {parse} from '@loaders.gl/core';
import {validateLoader} from 'test/common/conformance';
import inlineStyleText from './data/map-style/inline.style.json?raw';
import {
  MapStyleLoader,
  resolveMapStyle,
  type MapStyle,
  type MapStyleLoadOptions
} from '../src/index';

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

test('MapStyleLoader#loader conformance', t => {
  validateLoader(t, MapStyleLoader, 'MapStyleLoader');
  t.end();
});

test('MapStyleLoader#parse inline style fixture', async t => {
  const style = await parse(inlineStyleText, MapStyleLoader, {
    mapStyle: {baseUrl: INLINE_STYLE_URL.href}
  });

  t.equal(style.version, 8, 'style version is preserved');
  t.equal(style.layers.length, 1, 'style layers are loaded');
  t.equal(style.sources['inline-source']?.type, 'vector', 'source metadata is preserved');
  t.equal(
    style.sources['inline-source']?.tiles?.[0]?.includes('/tiles/{z}/{x}/{y}.mvt'),
    true,
    'relative tile template is normalized'
  );
  t.deepEqual(
    style.sources['inline-source']?.custom,
    {preserved: true},
    'unknown source fields are preserved'
  );

  t.end();
});

test('resolveMapStyle resolves relative tiles from baseUrl', async t => {
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

  t.equal(
    resolvedStyle.sources.basemap.tiles?.[0],
    'https://example.com/styles/tiles/{z}/{x}/{y}.mvt',
    'tile template is resolved against baseUrl'
  );

  t.end();
});

test('resolveMapStyle resolves TileJSON-backed sources', async t => {
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

  t.equal(requestedUrl, TILEJSON_URL, 'relative TileJSON URL is resolved before fetch');
  t.equal(resolvedStyle.sources.terrain.url, TILEJSON_URL, 'resolved source URL is stored');
  t.equal(
    resolvedStyle.sources.terrain.tiles?.[0],
    TILE_TEMPLATE_URL,
    'TileJSON tiles are resolved against the TileJSON URL'
  );
  t.equal(resolvedStyle.sources.terrain.minzoom, 2, 'TileJSON fields are merged');
  t.equal(
    resolvedStyle.sources.terrain.attribution,
    'kept',
    'existing source fields are preserved'
  );

  t.end();
});

test('MapStyleLoader honors custom fetch implementation', async t => {
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

  t.deepEqual(requestedUrls, [TILEJSON_URL], 'custom fetch is used for source resolution');
  t.equal(style.sources.basemap.tiles?.[0], 'https://example.com/styles/tiles/{z}/{x}/{y}.mvt');

  t.end();
});

test('resolveMapStyle preserves extra fields and initializes empty collections', async t => {
  const style = await resolveMapStyle({
    version: 8,
    metadata: {theme: 'test'},
    custom: {enabled: true}
  });

  t.deepEqual(style.sources, {}, 'sources default to an empty object');
  t.deepEqual(style.layers, [], 'layers default to an empty array');
  t.deepEqual(style.custom, {enabled: true}, 'extra top-level fields are preserved');

  t.end();
});

test('MapStyleLoader rejects invalid JSON', async t => {
  await t.rejects(
    async () => await MapStyleLoader.parse(new TextEncoder().encode('{"version":8').buffer, {}),
    /JSON/,
    'invalid JSON is rejected'
  );

  t.end();
});

test('resolveMapStyle rejects invalid fetched TileJSON', async t => {
  await t.rejects(
    async () =>
      await resolveMapStyle(
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
    /Invalid input/,
    'invalid fetched TileJSON is rejected'
  );

  t.end();
});
