// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, load, loadInBatches} from '@loaders.gl/core';
import {TCXLoader} from '@loaders.gl/kml';
import type {GeoJSONTable} from '@loaders.gl/schema';
const TCX_URL = '@loaders.gl/kml/test/data/tcx/tcx_sample';
test('TCXLoader#loader conformance', () => {
  validateLoader(TCXLoader, 'TCXLoader');
});
test.skip('TCXLoader#parse', async () => {
  const table = (await load(`${TCX_URL}.tcx`, TCXLoader, {
    gis: {format: 'geojson'}
  })) as GeoJSONTable;
  const resp = await fetchFile(`${TCX_URL}.geojson`);
  const geojson = await resp.json();
  geojson.shape = 'geojson-table';
  // TODO - lots of nulls injected in the metrics- should they be copies?
  // console.error(JSON.stringify(table, null, 2));
  // t.deepEqual(table, geojson, 'Data matches GeoJSON');
  expect(table.features.length, 'Data matches GeoJSON').toBe(1);
});
test('TCXLoader#parseInBatches', async () => {
  const iterator = await loadInBatches(`${TCX_URL}.tcx`, TCXLoader, {gis: {format: 'geojson'}});
  let data: any;
  for await (const batch of iterator) {
    data = batch;
  }
  // const resp = await fetchFile(`${TCX_URL}.geojson`);
  // const geojson = await resp.json();
  // geojson.shape = 'geojson-table';
  expect(data.features.length).toBe(1);
});
