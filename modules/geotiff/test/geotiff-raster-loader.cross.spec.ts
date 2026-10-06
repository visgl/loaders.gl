// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GeoTIFFRasterLoader} from '@loaders.gl/geotiff';

test('numeric GeoTIFF public preload works in Node and Chromium', async () => {
  const url = new URL('./data/numeric/scaled-int16-big-endian.tif', import.meta.url);
  let bytes: ArrayBuffer;
  if (url.protocol === 'file:') {
    const {readFile} = await import('node:fs/promises');
    bytes = new Uint8Array(await readFile(url)).buffer;
  } else {
    bytes = await (await fetch(url)).arrayBuffer();
  }
  const result = await load(bytes, GeoTIFFRasterLoader);
  expect(result.images[0].bands[0].data).toBeInstanceOf(Int16Array);
  expect(result.images[0].bands[0].data[0]).toBe(128);
});
