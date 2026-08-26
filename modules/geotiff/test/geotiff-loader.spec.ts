// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';

import {load} from '@loaders.gl/core';
import {GeoTIFFLoader, GeoTIFFSourceLoader} from '@loaders.gl/geotiff';

const TIFF_URL = '@loaders.gl/geotiff/test/data/gfw-azores.tif';

test('GeoTIFFLoader.', async t => {
  const geoimage = await load(TIFF_URL, GeoTIFFLoader);
  t.ok(geoimage, 'GeoTIFFLoader returned a result');

  t.end();
});

test('GeoTIFF raster query capabilities report cancellation conservatively', async t => {
  const source = GeoTIFFSourceLoader.createDataSource('https://example.com/data.tif', {});
  t.equal(source.getRasterQueryCapabilities().bounds, 'pushdown');
  t.notOk(source.getRasterQueryCapabilities().cancellation);
  t.end();
});
