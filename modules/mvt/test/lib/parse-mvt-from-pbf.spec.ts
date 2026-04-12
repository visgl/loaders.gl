// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {BinaryFeatureCollection} from '@loaders.gl/schema';
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
  // expect(tile.layers.layer0.idColumn[0], 'idColumn is 1').toEqual(1);
  expect(tile.layers.layer0.geometryTypeColumn[0], 'geometryTypeColumn is 1').toEqual(1);
  expect(tile.layers.layer0.columns.cartodb_id[0], 'cartodb_id is 3').toEqual(3);
  expect(tile.layers.layer0.columns._cdb_feature_count[0], '_cdb_feature_count is 1').toEqual(1);
  expect(
    tile.layers.layer0.schema.fields,
    'schema fields are correct'
  ).toEqual([
    {name: 'cartodb_id', type: 'uint32', nullable: false},
    {name: '_cdb_feature_count', type: 'uint32', nullable: false}
  ]);

  //   {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'Point',
  //       coordinates: [0.5576171875, 0.185546875]
  //     },
  //     properties: {
  //       // eslint-disable-next-line camelcase
  //       cartodb_id: 3,
  //       // eslint-disable-next-line camelcase
  //       _cdb_feature_count: 1,
  //       layerName: 'layer0'
  //     }
  //   }
  // ]);

});

// test('Line MVT to local coordinates JSON', async (t) => {
//   const response = await fetchFile(MVT_LINES_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
//   t.deepEqual(geometryJSON, [
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'LineString',
//         coordinates: [
//           [-0.00390625, 0.48876953125],
//           [0.0009765625, 0.490234375]
//         ]
//       },
//       properties: {
//         // eslint-disable-next-line camelcase
//         cartodb_id: 1,
//         layerName: 'layer0'
//       }
//     }
//   ]);

//   
// });

// test('Polygon MVT to local coordinates JSON', async (t) => {
//   const response = await fetchFile(MVT_POLYGONS_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
//   expect(geometryJSON).toEqual(decodedPolygonsGeometry);

//   
// });

// test('MVTLoader#Parse Point MVT', async (t) => {
//   for (const binary of [true, false]) {
//     const outputFormat = binary ? 'binary' : 'geojson';
//     const response = await fetchFile(MVT_POINTS_DATA_URL);
//     const mvtArrayBuffer = await response.arrayBuffer();

//     const loaderOptions: MVTLoaderOptions = {
//       mvt: {
//         coordinates: 'wgs84',
//         tileIndex: {
//           x: 2,
//           y: 6,
//           z: 4
//         }
//       }
//     };
//     if (binary) {
//       loaderOptions.gis = {format: 'binary'};
//     }

//     loaderOptions.worker = false;
//     const geometry = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
//     let expected = decodedPointsGeoJSON;
//     if (binary) {
//       // @ts-ignore
//       expected = geojsonToBinary(expected);
//       expect(geometry.byteLength > 0).toBeTruthy();
//       delete geometry.byteLength;
//     }
//     expect(geometry, `Parsed Point MVT as ${outputFormat}`).toEqual(expected);
//   }
//   
// });

// test('MVTLoader#Parse Lines MVT', async (t) => {
//   for (const binary of [true, false]) {
//     const outputFormat = binary ? 'binary' : 'geojson';

//     const response = await fetchFile(MVT_LINES_DATA_URL);
//     const mvtArrayBuffer = await response.arrayBuffer();

//     const loaderOptions: MVTLoaderOptions = {
//       mvt: {
//         coordinates: 'wgs84',
//         tileIndex: {
//           x: 2,
//           y: 1,
//           z: 2
//         }
//       }
//     };
//     if (binary) {
//       loaderOptions.gis = {format: 'binary'};
//     }

//     const geometry = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
//     let expected = decodedLinesGeoJSON;
//     if (binary) {
//       // @ts-ignore
//       expected = geojsonToBinary(expected);
//       expect(geometry.byteLength > 0).toBeTruthy();
//       delete geometry.byteLength;
//     }
//     expect(geometry, `Parsed Lines MVT as ${outputFormat}`).toEqual(expected);
//   }
//   
// });

// test('MVTLoader#Parse Polygons MVT', async (t) => {
//   for (const binary of [true, false]) {
//     const outputFormat = binary ? 'binary' : 'geojson';

//     const response = await fetchFile(MVT_POLYGONS_DATA_URL);
//     const mvtArrayBuffer = await response.arrayBuffer();

//     const loaderOptions: MVTLoaderOptions = {
//       mvt: {
//         coordinates: 'wgs84',
//         tileIndex: {
//           x: 133,
//           y: 325,
//           z: 10
//         }
//       }
//     };
//     if (binary) {
//       loaderOptions.gis = {format: 'binary'};
//     }

//     const geometry = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
//     let expected = decodedPolygonsGeoJSON;
//     if (binary) {
//       // @ts-ignore
//       expected = geojsonToBinary(expected, {fixRingWinding: false});
//       expect(geometry.byteLength > 0).toBeTruthy();
//       delete geometry.byteLength;
//     }
//     expect(geometry, `Parsed Polygons MVT as ${outputFormat}`).toEqual(expected);
//   }
//   
// });

// test('Should raise an error when coordinates param is wgs84 and tileIndex is missing', async (t) => {
//   const response = await fetchFile(MVT_POINTS_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const loaderOptions: MVTLoaderOptions = {
//     mvt: {coordinates: 'wgs84'}
//   };

//   expect(() => parseSync(mvtArrayBuffer, MVTLoader, loaderOptions)).toThrow();

//   
// });

// test('Should add layer name to custom property', async (t) => {
//   const response = await fetchFile(MVT_POINTS_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const loaderOptions: MVTLoaderOptions = {
//     mvt: {layerProperty: 'layerSource'}
//   };

//   const geometryJSON = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
//   expect(geometryJSON[0].properties.layerSource).toBe('layer0');

//   
// });

// test('Should return features from selected layers when layers property is provided', async (t) => {
//   const response = await fetchFile(MVT_MULTIPLE_LAYERS_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const loaderOptions: MVTLoaderOptions = {
//     mvt: {layers: ['layer1']}
//   };

//   const geometryJSON = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
//   const anyFeatureFromAnotherLayer = geometryJSON.some(
//     (feature) => feature.properties.layerName !== 'layer1'
//   );
//   t.false(anyFeatureFromAnotherLayer);
//   expect(geometryJSON[0].properties.layerName).toBe('layer1');

//   
// });

// test('Polygon MVT to local coordinates binary', async (t) => {
//   const response = await fetchFile(MVT_POLYGONS_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const geometryBinary = await parse(mvtArrayBuffer, MVTLoader, {gis: {format: 'binary'}});
//   expect(geometryBinary.byteLength > 0).toBeTruthy();
//   delete geometryBinary.byteLength;

//   // @ts-ignore deduced type of 'Feature' is string...
//   const expectedBinary = geojsonToBinary(decodedPolygonsGeometry);
//   expect(geometryBinary).toEqual(expectedBinary);
//   
// });

// test('MVTLoader#Parse geojson-to-binary', async (t) => {
//   for (const filename of TEST_FILES) {
//     const response = await fetchFile(filename);
//     const mvtArrayBuffer = await response.arrayBuffer();
//     const geojson = await parse(mvtArrayBuffer, MVTLoader);

//     // Pass a fresh response otherwise get CI testing errors
//     const response2 = await fetchFile(filename);
//     const mvtArrayBuffer2 = await response2.arrayBuffer();
//     const binary = await parse(mvtArrayBuffer2, MVTLoader, {gis: {format: 'binary'}});
//     delete binary.byteLength;

//     const expectedBinary = geojsonToBinary(geojson);
//     expect(expectedBinary).toEqual(binary);
//   }
//   
// });

// test('Features with top-level id', async (t) => {
//   const response = await fetchFile(WITH_FEATURE_ID);
//   const mvtArrayBuffer = await response.arrayBuffer();

//   const binary = await parse(mvtArrayBuffer, MVTLoader, {mvt: {shape: 'binary'}});
//   expect(binary.points.fields.length, 'feature.id fields are preserved').toBeTruthy();
//   expect(binary.lines.fields.length, 'feature.id fields are preserved').toBeTruthy();
//   expect(binary.polygons.fields.length, 'feature.id fields are preserved').toBeTruthy();

//   const feature = binaryToGeojson(binary, {
//     globalFeatureId: binary.points.globalFeatureIds.value[0]
//   });
//   // @ts-ignore
//   expect(feature.id, 'feature.id is restored').toBeTruthy();

//   
// });

// test('Empty MVT must return empty binary format', async (t) => {
//   const emptyMVTArrayBuffer = new Uint8Array();
//   const geometryBinary = await parse(emptyMVTArrayBuffer, MVTLoader, {gis: {format: 'binary'}});
//   expect(geometryBinary.points).toBeTruthy();
//   expect(geometryBinary.lines).toBeTruthy();
//   expect(geometryBinary.polygons).toBeTruthy();
//   expect(geometryBinary.points.positions.size === 2).toBeTruthy();
//   expect(geometryBinary.lines.positions.size === 2).toBeTruthy();
//   expect(geometryBinary.polygons.positions.size === 2).toBeTruthy();

//   
// });

// test('Triangulation is supported', async (t) => {
//   const response = await fetchFile(MVT_POLYGONS_DATA_URL);
//   const mvtArrayBuffer = await response.arrayBuffer();
//   const geometry = await parse(mvtArrayBuffer, MVTLoader, {
//     gis: {format: 'binary'}
//   });

//   // Closed polygon with 31 vertices (0===30)
//   expect(geometry.polygons.positions).toBeTruthy();
//   expect(geometry.polygons.positions.value.length).toBe(62);

//   expect(geometry.polygons.triangles).toBeTruthy();
//   expect(geometry.polygons.triangles.value.length).toBe(84);

//   // Basic check that triangulation is valid
//   const minI = Math.min(...geometry.polygons.triangles.value);
//   const maxI = Math.max(...geometry.polygons.triangles.value);
//   expect(minI).toBe(0);
//   expect(maxI).toBe(29); // Don't expect to find 30 as closed polygon

//   
// });
