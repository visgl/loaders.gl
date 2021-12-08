import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToFlatGeojson} from '@loaders.gl/gis';

const FEATURES_2D = '@loaders.gl/gis/test/data/2d_features.json';

test.only('gis#geojson-to-flatGeojson', async (t) => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();

  const flatFeatures = geojsonToFlatGeojson(features);
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;

  // Point
  t.deepEquals(point.geometry.data, [100, 0], 'flat Point data should be equivalent');
  t.deepEquals(point.geometry.lines, [0], 'flat Point lines should be equivalent');

  // MultiPoint
  t.deepEquals(
    multiPoint.geometry.data,
    [100, 0, 101, 1],
    'flat MultiPoint data should be equivalent'
  );
  t.deepEquals(multiPoint.geometry.lines, [0, 2], 'flat MultiPoint lines should be equivalent');

  // LineString
  t.deepEquals(
    lineString.geometry.data,
    [100, 0, 101, 1],
    'flat LineString data should be equivalent'
  );
  t.deepEquals(lineString.geometry.lines, [0], 'flat LineString lines should be equivalent');

  // MultiLineString
  t.deepEquals(
    multiLineString.geometry.data,
    [100, 0, 101, 1, 102, 2, 103, 3],
    'flat MultiLineString data should be equivalent'
  );
  t.deepEquals(
    multiLineString.geometry.lines,
    [0, 4],
    'flat MultiLineString lines should be equivalent'
  );

  // Polygon
  t.deepEquals(
    polygon.geometry.data,
    [100, 0, 101, 0, 101, 1, 100, 1, 100, 0],
    'flat Polygon data should be equivalent'
  );
  t.deepEquals(polygon.geometry.lines, [[0]], 'flat Polygon lines should be equivalent');
  t.deepEquals(polygon.geometry.areas, [[-1]], 'flat Polygon areas should be equivalent');

  // Polygon (hole)
  t.deepEquals(
    polygonWithHole.geometry.data,
    [
      100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2, 100.2, 0.8, 100.8,
      0.8
    ],
    'flat Polygon (hole) data should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.lines,
    [[0, 10]],
    'flat Polygon (hole) lines should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.areas,
    [[-1, 0.3599999999999966]],
    'flat Polygon (hole) areas should be equivalent'
  );

  // MultiPolygon
  t.deepEquals(
    multiPolygon.geometry.data,
    [
      102, 2, 103, 2, 103, 3, 102, 3, 102, 2, 100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.2, 0.2,
      100.2, 0.8, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2
    ],
    'flat MultiPolygon data should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.lines,
    [[0], [10, 20]],
    'flat MultiPolygon lines should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.areas,
    [[-1], [-1, 0.3599999999999966]],
    'flat MultiPolygon areas should be equivalent'
  );

  t.end();
});
