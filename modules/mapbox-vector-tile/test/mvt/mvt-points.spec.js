/* eslint-disable */

import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mapbox-vector-tile';
import {fetchFile, parse} from '@loaders.gl/core';

const MVT_POINTS_DATA_URL = '@loaders.gl/mapbox-vector-tile/test/data/points_generated_2-0-1.mvt';

test('Point MVT', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  t.deepEqual(parse(mvtArrayBuffer, MVTLoader), {});

  t.end();
});
