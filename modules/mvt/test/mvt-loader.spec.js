import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mvt';
import {fetchFile, parse} from '@loaders.gl/core';

const MVT_POINTS_DATA_URL = '@loaders.gl/mvt/test/data/points_generated_2-0-1.mvt';
const MVT_LINES_DATA_URL = '@loaders.gl/mvt/test/data/lines_generated_5-16-11.mvt';
const MVT_POLYGONS_DATA_URL = '@loaders.gl/mvt/test/data/gadm_usa_3-0-3.mvt';

// import decodedGeoJSON from '../results/decoded_mvt_points.json';
// import decodedGeoJSON from '../results/decoded_mvt_lines.json';
// import decodedGeoJSON from '../results/decoded_mvt_polygons.json';

test('Point MVT', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    tileProperties: {
      x: 0,
      y: 1,
      z: 2
    }
  };

  // eslint-disable-next-line
  const geojson = parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  // t.deepEqual(geojson, decodedGeoJSON);

  t.end();
});

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

  // eslint-disable-next-line
  const geojson = parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  // t.deepEqual(geojson, decodedGeoJSON);

  t.end();
});

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

  // eslint-disable-next-line
  const geojson = parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  // t.deepEqual(geojson, decodedGeoJSON);

  t.end();
});
