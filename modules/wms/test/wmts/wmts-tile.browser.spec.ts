// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {WMTSSourceLoader} from '@loaders.gl/wms';
import {IMAGE_DATA_URL} from '../../../images/test/lib/test-cases';

test('WMTS valid tiles still decode through the public source loader and forward cancellation', async () => {
  const source = createDataSource('https://example.com/wmts', [WMTSSourceLoader], {
    wmts: {
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'imagery',
              formats: ['image/png'],
              styles: [],
              resourceURLs: [],
              tileMatrixSetLinks: [],
              dimensions: [{identifier: 'Time', default: '2026-09-01T00:00:00Z', values: []}]
            }
          ],
          tileMatrixSets: []
        }
      }
    }
  });
  // Reuse the image module's tiny fixture for one public-entrypoint decoding check.
  const bytes = Uint8Array.from(atob(IMAGE_DATA_URL.split(',')[1]), character =>
    character.charCodeAt(0)
  );
  const controller = new AbortController();
  source.fetch = vi.fn(async (url, options) => {
    expect(options?.signal).toBe(controller.signal);
    expect(new URL(String(url)).searchParams.get('Time')).toBe('2026-09-01T00:00:00Z');
    return new Response(bytes, {headers: {'content-type': 'image/png'}});
  });
  const image = await source.getTile({x: 2, y: 1, z: 1, signal: controller.signal});
  expect(image).toMatchObject({width: 2, height: 2});
  expect(source.fetch).toHaveBeenCalledTimes(1);
});
