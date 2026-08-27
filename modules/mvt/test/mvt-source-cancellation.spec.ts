// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import type {MVTLoaderOptions} from '../src/mvt-loader';
import {MVTTileSource} from '../src/mvt-source-loader';

test('MVTTileSource#getTile forwards cancellation to the tile request', async () => {
  const controller = new AbortController();
  let receivedSignal: AbortSignal | null = null;
  const source = new MVTTileSource('https://example.com/{z}/{x}/{y}.pbf', {
    core: {
      loadOptions: {
        core: {
          fetch: async (url, options) => {
            if (String(url).endsWith('tilejson.json')) return new Response(null, {status: 404});
            receivedSignal = options?.signal || null;
            return new Response(new Uint8Array([1, 2, 3]));
          }
        }
      }
    }
  });

  await source.getTile({x: 0, y: 0, z: 0, signal: controller.signal});
  await source.metadata;
  expect(receivedSignal).toBe(controller.signal);
});

test('MVTTileSource#getVectorTile forwards requested layers to the decoder', async () => {
  let receivedOptions: MVTLoaderOptions | undefined;
  const coreApi = {
    async parse(_data: unknown, _loaders: unknown, options: MVTLoaderOptions) {
      receivedOptions = options;
      return {shape: 'arrow-table'};
    }
  } as unknown as CoreAPI;
  const source = new MVTTileSource(
    'https://example.com/{z}/{x}/{y}.pbf',
    {
      mvt: {metadataUrl: null, shape: 'arrow-table'},
      core: {
        loadOptions: {
          core: {fetch: async () => new Response(new Uint8Array([1]))},
          mvt: {layerProperty: 'sourceLayer', layers: ['fallback']}
        }
      }
    },
    coreApi
  );

  await source.getVectorTile({x: 2, y: 1, z: 3, layers: 'roads'});
  expect(receivedOptions?.mvt).toMatchObject({
    shape: 'arrow-table',
    coordinates: 'wgs84',
    tileIndex: {x: 2, y: 1, z: 3},
    layerProperty: 'sourceLayer',
    layers: ['roads']
  });
});
