// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)
/* eslint-disable */

import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mapbox-vector-tiles';
import {fetchFile, parse} from '@loaders.gl/core';

const MVT_LINES_DATA_URL = '@loaders.gl/mapbox-vector-tiles/test/data/lines_generated_5-16-11.mvt';

test('Lines MVT', async t => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  t.deepEqual(parse(mvtArrayBuffer, MVTLoader), {
    type: 'Line',
    coordinates: [ [0, 1] ]
  });

  t.end();
});
