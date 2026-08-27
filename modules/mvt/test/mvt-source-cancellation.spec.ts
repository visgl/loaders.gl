// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
