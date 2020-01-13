/* eslint-disable */

import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mapbox-vector-tile';
import {fetchFile, parse} from '@loaders.gl/core';

import decodedGeoJSON from '../results/decoded_mvt_polygons.json';

const MVT_POLYGONS_DATA_URL = '@loaders.gl/mapbox-vector-tile/test/data/gadm_usa_3-0-3.mvt';

test('Polygons MVT', async t => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    tileProperties: {
      x: 0,
      y: 3,
      z: 3
    }
  };

  t.deepEqual(parse(mvtArrayBuffer, MVTLoader, loaderOptions), decodedGeoJSON);

  t.end();
});
