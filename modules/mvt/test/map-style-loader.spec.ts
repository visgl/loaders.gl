// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {readFile} from 'fs/promises';
import {parse} from '@loaders.gl/core';
import {validateLoader} from 'test/common/conformance';
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
const FILE_STYLE_BASE_URL = '/tmp/styles/root.style.json';
const FILE_TILEJSON_URL = '/tmp/styles/terrain.tilejson';

function createJsonResponse(json: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return json;
    }
  };
}

test('MapStyleLoader#loader conformance', (t) => {
  validateLoader(t, MapStyleLoader, 'MapStyleLoader');
  t.end();
});

test('MapStyleLoader#parse inline style fixture', async (t) => {
  const styleText = await readFile(INLINE_STYLE_URL, 'utf8');
  const style = await parse(styleText, MapStyleLoader, {
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

test('resolveMapStyle resolves relative tiles from baseUrl', async (t) => {
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

test('resolveMapStyle resolves TileJSON-backed sources', async (t) => {
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
        fetch: async (url) => {
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

test('resolveMapStyle resolves filesystem paths and ref layers', async (t) => {
  let requestedUrl = '';
  const resolvedStyle = await resolveMapStyle(
    {
      version: 8,
      sources: {
        terrain: {
          type: 'vector',
          url: './terrain.tilejson'
        }
      },
      layers: [
        {id: 'terrain-fill', type: 'fill', source: 'terrain'},
        {id: 'terrain-outline', ref: 'terrain-fill'}
      ]
    },
    {
      mapStyle: {
        baseUrl: FILE_STYLE_BASE_URL,
        fetch: async (url) => {
          requestedUrl = String(url);
          return createJsonResponse({tiles: ['./tiles/{z}/{x}/{y}.pbf']}) as Response;
        }
      }
    }
  );

  t.equal(
    requestedUrl,
    FILE_TILEJSON_URL,
    'relative TileJSON path is resolved from the style path'
  );
  t.equal(
    resolvedStyle.sources.terrain.tiles?.[0],
    '/tmp/styles/tiles/{z}/{x}/{y}.pbf',
    'filesystem tile template is resolved from the TileJSON path'
  );
  t.equal(resolvedStyle.layers[1]?.type, undefined, 'ref layers may omit type');

  t.end();
});

test('normalizeMapStyleUrl preserves absolute URLs with filesystem bases', async (t) => {
  const resolvedStyle = await resolveMapStyle(
    {
      sources: {
        remote: {
          type: 'vector',
          tiles: ['https://cdn.example.com/tiles/{z}/{x}/{y}.pbf']
        }
      }
    },
    {mapStyle: {baseUrl: FILE_STYLE_BASE_URL}}
  );

  t.equal(
    resolvedStyle.sources.remote.tiles?.[0],
    'https://cdn.example.com/tiles/{z}/{x}/{y}.pbf',
    'absolute URLs are not treated as filesystem-relative paths'
  );

  t.end();
});

test('MapStyleLoader honors custom fetch implementation', async (t) => {
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
      fetch: async (url) => {
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

test('resolveMapStyle preserves extra fields and initializes empty collections', async (t) => {
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

test('MapStyleLoader rejects invalid JSON', async (t) => {
  await t.rejects(
    async () => await MapStyleLoader.parse(new TextEncoder().encode('{"version":8').buffer, {}),
    /JSON/,
    'invalid JSON is rejected'
  );

  t.end();
});

test('resolveMapStyle rejects invalid fetched TileJSON', async (t) => {
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
