// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {fetchFile, load} from '@loaders.gl/core';
import {GPXLoader} from '@loaders.gl/kml';

const GPX_URL = '@loaders.gl/kml/test/data/gpx/trek';

test('GPXLoader#loader conformance', (t) => {
  validateLoader(t, GPXLoader, 'GPXLoader');
  t.end();
});

test('GPXLoader#parse', async (t) => {
  const data = await load(`${GPX_URL}.gpx`, GPXLoader, {gpx: {shape: 'geojson-table'}});
  const resp = await fetchFile(`${GPX_URL}.geojson`);
  const geojson = await resp.json();
  geojson.shape = 'geojson-table';

  t.deepEqual(
    data.shape === 'geojson-table' && data.features,
    geojson.features,
    'Data matches GeoJSON'
  );
  t.end();
});
