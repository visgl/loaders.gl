// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, load} from '@loaders.gl/core';
import {GPXLoader} from '@loaders.gl/kml';
const GPX_URL = '@loaders.gl/kml/test/data/gpx/trek';
test('GPXLoader#loader conformance', () => {
  validateLoader(GPXLoader, 'GPXLoader');
});
test('GPXLoader#parse', async () => {
  const data = await load(`${GPX_URL}.gpx`, GPXLoader, {gpx: {shape: 'geojson-table'}});
  const resp = await fetchFile(`${GPX_URL}.geojson`);
  const geojson = await resp.json();
  geojson.shape = 'geojson-table';
  expect(data.shape === 'geojson-table' && data.features, 'Data matches GeoJSON').toEqual(
    geojson.features
  );
});
