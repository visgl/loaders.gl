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
  t.end();
});
