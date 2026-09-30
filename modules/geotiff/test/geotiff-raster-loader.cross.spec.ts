// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GeoTIFFRasterLoader} from '@loaders.gl/geotiff';

test('numeric GeoTIFF public preload works in Node and Chromium', async () => {
  const result = await load(
    '@loaders.gl/geotiff/test/data/numeric/scaled-int16-big-endian.tif',
    GeoTIFFRasterLoader
  );
  expect(result.images[0].bands[0].data).toBeInstanceOf(Int16Array);
  expect(result.images[0].bands[0].data[0]).toBe(128);
});
