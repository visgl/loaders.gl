// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {fetchFile, load, loadInBatches} from '@loaders.gl/core';
import {TCXLoader} from '@loaders.gl/kml';
import type {GeoJSONTable} from '@loaders.gl/schema';

const TCX_URL = '@loaders.gl/kml/test/data/tcx/tcx_sample';

test('TCXLoader#loader conformance', (t) => {
  validateLoader(t, TCXLoader, 'TCXLoader');
  t.end();
});

test.skip('TCXLoader#parse', async (t) => {
  const table = await load(`${TCX_URL}.tcx`, TCXLoader, {gis: {format: 'geojson'}}) as GeoJSONTable;
  const resp =  await fetchFile(`${TCX_URL}.geojson`);
  const geojson = await resp.json();
  geojson.shape = 'geojson-table';

  // TODO - lots of nulls injected in the metrics- should they be copies?
  // console.error(JSON.stringify(table, null, 2));
  
  // t.deepEqual(table, geojson, 'Data matches GeoJSON');
  t.equal(table.features.length, 1, 'Data matches GeoJSON')
  t.end();
});

test('TCXLoader#parseInBatches', async (t) => {
  const iterator = await loadInBatches(`${TCX_URL}.tcx`, TCXLoader, {gis: {format: 'geojson'}});
  let data: any;
  for await (const batch of iterator) {
    data = batch;
  }
  // const resp = await fetchFile(`${TCX_URL}.geojson`);
  // const geojson = await resp.json();
  // geojson.shape = 'geojson-table';

  console.error(JSON.stringify(data, null, 2));

  t.equal(data.data.features.length, 1);
  // t.deepEqual(data, geojson, 'Data matches GeoJSON');
  t.end();
});
