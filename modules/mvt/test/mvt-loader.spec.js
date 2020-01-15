import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mvt';
import {fetchFile, parse} from '@loaders.gl/core';

const MVT_POINTS_DATA_URL = '@loaders.gl/mvt/test/data/points_4-2-6.mvt';
const MVT_LINES_DATA_URL = '@loaders.gl/mvt/test/data/lines_2-2-1.mvt';
const MVT_POLYGONS_DATA_URL = '@loaders.gl/mvt/test/data/polygons_10-133-325.mvt';

import decodedPointsGeoJSON from './results/decoded_mvt_points.json';
import decodedLinesGeoJSON from './results/decoded_mvt_lines.json';
import decodedPolygonsGeoJSON from './results/decoded_mvt_polygons.json';

test('Point MVT', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      tileProperties: {
        x: 2,
        y: 6,
        z: 4
      }
    }
  };

  const geojson = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  t.deepEqual(geojson, decodedPointsGeoJSON);

  t.end();
});

test('Lines MVT', async t => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      tileProperties: {
        x: 2,
        y: 1,
        z: 2
      }
    }
  };

  const geojson = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  t.deepEqual(geojson, decodedLinesGeoJSON);

  t.end();
});

test('Polygons MVT', async t => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      tileProperties: {
        x: 133,
        y: 325,
        z: 10
      }
    }
  };

  const geojson = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  t.deepEqual(geojson, decodedPolygonsGeoJSON);

  t.end();
});
