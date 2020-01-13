/* eslint-disable */

import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mapbox-vector-tile';
import {fetchFile, parse} from '@loaders.gl/core';

const MVT_POLYGONS_DATA_URL = '@loaders.gl/mapbox-vector-tile/test/data/gadm_usa_3-0-3.mvt';

test('Polygons MVT', async t => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  t.deepEqual(parse(mvtArrayBuffer, MVTLoader), {});

  t.end();
});
