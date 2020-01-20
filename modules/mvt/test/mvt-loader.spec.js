import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mvt';
import {fetchFile, parse} from '@loaders.gl/core';

const MVT_POINTS_DATA_URL = '@loaders.gl/mvt/test/data/points_4-2-6.mvt';
const MVT_LINES_DATA_URL = '@loaders.gl/mvt/test/data/lines_2-2-1.mvt';
const MVT_POLYGONS_DATA_URL = '@loaders.gl/mvt/test/data/polygons_10-133-325.mvt';

// Geometry Array Results
import decodedPolygonsGeometry from '@loaders.gl/mvt/test/results/decoded_mvt_polygons_array.json';

// GeoJSON Results
import decodedPointsGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_points.json';
import decodedLinesGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_lines.json';
import decodedPolygonsGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_polygons.json';

test('Point MVT to Geometry Array', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryArray = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryArray, [[[{x: 1142, y: 380}]]]);

  t.end();
});

test('Line MVT to Geometry Array', async t => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryArray = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryArray, [[[{x: -8, y: 1001}, {x: 2, y: 1004}]]]);

  t.end();
});

test('Polygon MVT to Geometry Array', async t => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryArray = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryArray, decodedPolygonsGeometry);

  t.end();
});

test('Point MVT to GeoJSON', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      geojson: true,
      tileIndex: {
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

test('Lines MVT to GeoJSON', async t => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      geojson: true,
      tileIndex: {
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

test('Polygons MVT to GeoJSON', async t => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      geojson: true,
      tileIndex: {
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
