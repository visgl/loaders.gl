// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {load} from '@loaders.gl/core';
import {GeoTIFFLoader} from '@loaders.gl/geotiff';

const TIFF_URL = '@loaders.gl/geotiff/test/data/gfw-azores.tif';

test('GeoTIFFLoader.', async (t) => {
  const geoimage = await load(TIFF_URL, GeoTIFFLoader);
  t.ok(geoimage, 'GeoTIFFLoader returned a result');

  t.end();
});
