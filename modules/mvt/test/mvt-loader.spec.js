import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mvt';
import {setLoaderOptions, fetchFile, parse, parseSync} from '@loaders.gl/core';

const MVT_POINTS_DATA_URL = '@loaders.gl/mvt/test/data/points_4-2-6.mvt';
const MVT_LINES_DATA_URL = '@loaders.gl/mvt/test/data/lines_2-2-1.mvt';
const MVT_POLYGONS_DATA_URL = '@loaders.gl/mvt/test/data/polygons_10-133-325.mvt';

// Geometry Array Results
import decodedPolygonsGeometry from '@loaders.gl/mvt/test/results/decoded_mvt_polygons_array.json';

// GeoJSON Results
import decodedPointsGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_points.json';
import decodedLinesGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_lines.json';
import decodedPolygonsGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_polygons.json';

setLoaderOptions({
  mvt: {
    workerUrl: 'modules/mvt/dist/mvt-loader.worker.js'
  }
});

test('Point MVT to local coordinates JSON', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryJSON, [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0.5576171875, 0.185546875]
      },
      properties: {
        // eslint-disable-next-line camelcase
        cartodb_id: 3,
        // eslint-disable-next-line camelcase
        _cdb_feature_count: 1
      }
    }
  ]);

  t.end();
});

test('Line MVT to local coordinates JSON', async t => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryJSON, [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[-0.00390625, 0.48876953125], [0.0009765625, 0.490234375]]
      },
      properties: {
        // eslint-disable-next-line camelcase
        cartodb_id: 1
      }
    }
  ]);

  t.end();
});

test('Polygon MVT to local coordinates JSON', async t => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryJSON, decodedPolygonsGeometry);

  t.end();
});

test('Point MVT to GeoJSON', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {
      coordinates: 'wgs84',
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
      coordinates: 'wgs84',
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
      coordinates: 'wgs84',
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

test('Should raise an error when coordinates param is wgs84 and tileIndex is missing', async t => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {coordinates: 'wgs84'}
  };
  t.throws(() => parseSync(mvtArrayBuffer, MVTLoader, loaderOptions));
  t.end();
});
