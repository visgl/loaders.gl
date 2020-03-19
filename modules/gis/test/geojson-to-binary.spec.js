import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';

// Sample GeoJSON Files
// All features have 2D coordinates
const FEATURES_2D = '@loaders.gl/gis/test/data/2d_features.json';

test('gis#geojson-to-binary 2D features', async t => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const {points, lines, polygons} = geojsonToBinary(features);

  // 2D size
  t.equal(points.positions.size, 2);
  t.equal(lines.positions.size, 2);
  t.equal(polygons.positions.size, 2);

  // Other arrays have coordinate size 1
  t.equal(points.objectIds.size, 1);
  t.equal(lines.pathIndices.size, 1);
  t.equal(lines.objectIds.size, 1);
  t.equal(polygons.polygonIndices.size, 1);
  t.equal(polygons.primitivePolygonIndices.size, 1);
  t.equal(polygons.objectIds.size, 1);

  // Point value equality
  t.deepEqual(points.positions.value, [100, 0, 100, 0, 101, 1]);
  t.deepEqual(points.objectIds.value, [0, 1, 1]);

  // LineString value equality
  t.deepEqual(lines.pathIndices.value, [0, 2, 4]);
  t.deepEqual(lines.positions.value, [100, 0, 101, 1, 100, 0, 101, 1, 102, 2, 103, 3]);
  t.deepEqual(lines.objectIds.value, [2, 2, 3, 3, 3, 3]);

  // Polygon value equality
  t.deepEqual(polygons.polygonIndices.value, [0, 5, 15, 20]);
  t.deepEqual(polygons.primitivePolygonIndices.value, [0, 5, 10, 15, 20, 25]);
  t.deepEqual(polygons.positions.value, [
    100,
    0,
    101,
    0,
    101,
    1,
    100,
    1,
    100,
    0,
    100,
    0,
    101,
    0,
    101,
    1,
    100,
    1,
    100,
    0,
    100.8,
    0.8,
    100.8,
    0.2,
    100.2,
    0.2,
    100.2,
    0.8,
    100.8,
    0.8,
    102,
    2,
    103,
    2,
    103,
    3,
    102,
    3,
    102,
    2,
    100,
    0,
    101,
    0,
    101,
    1,
    100,
    1,
    100,
    0,
    100.2,
    0.2,
    100.2,
    0.8,
    100.8,
    0.8,
    100.8,
    0.2,
    100.2,
    0.2
  ]);
  t.deepEqual(polygons.objectIds.value, [
    4,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6
  ]);
  t.end();
});
