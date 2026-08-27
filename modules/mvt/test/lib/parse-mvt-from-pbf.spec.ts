// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseMVT} from '../../src/lib/mvt-pbf/parse-mvt-from-pbf';
import {fetchFile} from '@loaders.gl/core';
// import {geojsonToBinary, binaryToGeojson} from '@loaders.gl/gis';
const MVT_POINTS_DATA_URL = '@loaders.gl/mvt/test/data/mvt/points_4-2-6.mvt';
// const MVT_LINES_DATA_URL = '@loaders.gl/mvt/test/data/mvt/lines_2-2-1.mvt';
// const MVT_POLYGONS_DATA_URL = '@loaders.gl/mvt/test/data/mvt/polygons_10-133-325.mvt';
// const MVT_POLYGON_ZERO_SIZE_HOLE_DATA_URL =
//   '@loaders.gl/mvt/test/data/mvt/polygon_with_zero_size_hole.mvt';
// const MVT_MULTIPLE_LAYERS_DATA_URL =
//   '@loaders.gl/mvt/test/data/mvt/lines_10-501-386_multiplelayers.mvt';
// const WITH_FEATURE_ID = '@loaders.gl/mvt/test/data/mvt/with_feature_id.mvt';
// Test to sanity check that old method of parsing binary
// format via an intermediate geojson step produces the
// same result
// const TEST_FILES = [
//   MVT_POINTS_DATA_URL,
//   MVT_LINES_DATA_URL,
//   MVT_POLYGONS_DATA_URL,
//   MVT_POLYGON_ZERO_SIZE_HOLE_DATA_URL,
//   MVT_MULTIPLE_LAYERS_DATA_URL
// ];
// Geometry Array Results
// /// GeoJSON Results
// import decodedPolygonsGeometry from '@loaders.gl/mvt/test/data/mvt-results/decoded_mvt_polygons_array.json' assert {type: 'json'};
// // GeoJSON Results
// import decodedPointsGeoJSON from '@loaders.gl/mvt/test/data/mvt-results/decoded_mvt_points.json' assert {type: 'json'};
// import decodedLinesGeoJSON from '@loaders.gl/mvt/test/data/mvt-results/decoded_mvt_lines.json' assert {type: 'json'};
// import decodedPolygonsGeoJSON from '@loaders.gl/mvt/test/data/mvt-results/decoded_mvt_polygons.json' assert {type: 'json'};
// setLoaderOptions({
//   _workerType: 'test'
// });
test('Point MVT to local coordinates JSON', async () => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();
  const tile = parseMVT(mvtArrayBuffer);
  expect(tile.layers.layer0.length, 'layer0 has 1 feature').toEqual(1);
  // t.deepEqual(tile.layers.layer0.idColumn[0], 1, 'idColumn is 1');
  expect(tile.layers.layer0.geometryTypeColumn[0], 'geometryTypeColumn is 1').toEqual(1);
  expect(tile.layers.layer0.columns.cartodb_id[0], 'cartodb_id is 3').toEqual(3);
  expect(tile.layers.layer0.columns._cdb_feature_count[0], '_cdb_feature_count is 1').toEqual(1);
  expect(tile.layers.layer0.schema.fields, 'schema fields are correct').toEqual([
    {name: 'cartodb_id', type: 'uint32', nullable: false},
    {name: '_cdb_feature_count', type: 'uint32', nullable: false}
  ]);
});
