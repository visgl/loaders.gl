/* eslint-disable */

import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mapbox-vector-tile';
import {fetchFile, parse} from '@loaders.gl/core';

import decodedGeoJSON from '../results/decoded_mvt_lines.json';

const MVT_LINES_DATA_URL = '@loaders.gl/mapbox-vector-tile/test/data/lines_generated_5-16-11.mvt';

test('Lines MVT', async t => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    tileProperties: {
      x: 16,
      y: 11,
      z: 5
    }
  };

  t.deepEqual(parse(mvtArrayBuffer, MVTLoader, loaderOptions), decodedGeoJSON);

  t.end();
});
