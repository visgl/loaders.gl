// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {createDataSource} from '@loaders.gl/core';
import {OMEZarrSourceLoader} from '@loaders.gl/zarr';

const SPATIALDATA_V3_FIXTURE_URL = '/modules/zarr/test/data/spatialdata-v3.zarr';

test('OMEZarrSourceLoader supports browser-relative store URLs', async t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [OMEZarrSourceLoader], {
    zarr: {path: 'images/example-image'}
  });
  const metadata = await source.getMetadata();

  t.equal(metadata.name, 'ome-zarr example');
  t.equal(metadata.width, 439);
  t.equal(metadata.height, 167);
  t.equal(metadata.bandCount, 3);
  t.end();
});
