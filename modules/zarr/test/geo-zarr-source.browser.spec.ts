// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {createDataSource} from '@loaders.gl/core';
import {GeoZarrSourceLoader} from '@loaders.gl/zarr';

const SPATIALDATA_V3_FIXTURE_URL = '/modules/zarr/test/data/spatialdata-v3.zarr';

test('GeoZarrSourceLoader supports browser-relative store metadata', async t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [GeoZarrSourceLoader], {
    zarr: {path: 'images/example-image'},
    geozarr: {array: '0'}
  });
  const metadata = await source.getMetadata();

  t.equal(metadata.crs, 'EPSG:4326');
  t.deepEqual(metadata.spatialDimensions, ['y', 'x']);
  t.deepEqual(metadata.boundingBox, [
    [-20, -6.7],
    [23.9, 10]
  ]);
  t.end();
});
