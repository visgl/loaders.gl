// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';

test('unbuilt GeoTIFFLoader metadata has a version without the injected build constant', async () => {
  vi.stubGlobal('__VERSION__', undefined);
  try {
    const {GeoTIFFLoader} = await import('../../src/geotiff/geotiff-loader-types');
    expect(GeoTIFFLoader.version).toBe('latest');
  } finally {
    vi.unstubAllGlobals();
  }
});
