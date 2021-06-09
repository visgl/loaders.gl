import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mvt';
import {setLoaderOptions, fetchFile, parse, parseSync} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';
import {TEST_EXPORTS} from '@loaders.gl/mvt/lib/binary-vector-tile/vector-tile-feature';

const {classifyRings} = TEST_EXPORTS;

const MVT_POINTS_DATA_URL = '@loaders.gl/mvt/test/data/points_4-2-6.mvt';
const MVT_LINES_DATA_URL = '@loaders.gl/mvt/test/data/lines_2-2-1.mvt';
const MVT_POLYGONS_DATA_URL = '@loaders.gl/mvt/test/data/polygons_10-133-325.mvt';
const MVT_POLYGON_ZERO_SIZE_HOLE_DATA_URL =
  '@loaders.gl/mvt/test/data/polygon_with_zero_size_hole.mvt';
const MVT_MULTIPLE_LAYERS_DATA_URL =
  '@loaders.gl/mvt/test/data/lines_10-501-386_multiplelayers.mvt';

// Geometry Array Results
import decodedPolygonsGeometry from '@loaders.gl/mvt/test/results/decoded_mvt_polygons_array.json';

// GeoJSON Results
import decodedPointsGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_points.json';
import decodedLinesGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_lines.json';
import decodedPolygonsGeoJSON from '@loaders.gl/mvt/test/results/decoded_mvt_polygons.json';

// Rings
import ringsSingleRing from '@loaders.gl/mvt/test/data/rings_single_ring.json';
import ringsRingAndHole from '@loaders.gl/mvt/test/data/rings_ring_and_hole.json';
import ringsTwoRings from '@loaders.gl/mvt/test/data/rings_two_rings.json';
import ringsZeroSizeHole from '@loaders.gl/mvt/test/data/rings_zero_size_hole.json';

setLoaderOptions({
  _workerType: 'test'
});

test('Point MVT to local coordinates JSON', async (t) => {
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
        _cdb_feature_count: 1,
        layerName: 'layer0'
      }
    }
  ]);

  t.end();
});

test('Line MVT to local coordinates JSON', async (t) => {
  const response = await fetchFile(MVT_LINES_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryJSON, [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-0.00390625, 0.48876953125],
          [0.0009765625, 0.490234375]
        ]
      },
      properties: {
        // eslint-disable-next-line camelcase
        cartodb_id: 1,
        layerName: 'layer0'
      }
    }
  ]);

  t.end();
});

test('Polygon MVT to local coordinates JSON', async (t) => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader);
  t.deepEqual(geometryJSON, decodedPolygonsGeometry);

  t.end();
});

test('Point MVT to GeoJSON', async (t) => {
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

test('Lines MVT to GeoJSON', async (t) => {
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

test('Polygons MVT to GeoJSON', async (t) => {
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

test('Should raise an error when coordinates param is wgs84 and tileIndex is missing', async (t) => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {coordinates: 'wgs84'}
  };

  t.throws(() => parseSync(mvtArrayBuffer, MVTLoader, loaderOptions));

  t.end();
});

test('Should add layer name to custom property', async (t) => {
  const response = await fetchFile(MVT_POINTS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {layerProperty: 'layerSource'}
  };

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  t.equals(geometryJSON[0].properties.layerSource, 'layer0');

  t.end();
});

test('Should return features from selected layers when layers property is provided', async (t) => {
  const response = await fetchFile(MVT_MULTIPLE_LAYERS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const loaderOptions = {
    mvt: {layers: ['layer1']}
  };

  const geometryJSON = await parse(mvtArrayBuffer, MVTLoader, loaderOptions);
  const anyFeatureFromAnotherLayer = geometryJSON.some(
    (feature) => feature.properties.layerName !== 'layer1'
  );
  t.false(anyFeatureFromAnotherLayer);
  t.equals(geometryJSON[0].properties.layerName, 'layer1');

  t.end();
});

test('Polygon MVT to local coordinates binary', async (t) => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();

  const geometryBinary = await parse(mvtArrayBuffer, MVTLoader, {gis: {format: 'binary'}});
  t.ok(geometryBinary.byteLength > 0);
  delete geometryBinary.byteLength;
  delete geometryBinary.polygons.triangles;
  t.deepEqual(geometryBinary, geojsonToBinary(decodedPolygonsGeometry));

  t.end();
});

// Test to sanity check that old method of parsing binary
// format via an intermediate geojson step produces the
// same result
const TEST_FILES = [
  MVT_POINTS_DATA_URL,
  MVT_LINES_DATA_URL,
  MVT_POLYGONS_DATA_URL,
  MVT_POLYGON_ZERO_SIZE_HOLE_DATA_URL,
  MVT_MULTIPLE_LAYERS_DATA_URL
];
for (const filename of TEST_FILES) {
  test(`Legacy MVT binary generation is equivalent ${filename}`, async (t) => {
    const response = await fetchFile(filename);
    const mvtArrayBuffer = await response.arrayBuffer();
    const geojson = await parse(mvtArrayBuffer, MVTLoader);

    // Pass a fresh response otherwise get CI testing errors
    const response2 = await fetchFile(filename);
    const mvtArrayBuffer2 = await response2.arrayBuffer();
    const binary = await parse(mvtArrayBuffer2, MVTLoader, {gis: {format: 'binary'}});
    delete binary.byteLength;
    delete binary.polygons.triangles;
    t.deepEqual(geojsonToBinary(geojson), binary);
    t.end();
  });
}

test('Empty MVT must return empty binary format', async (t) => {
  const emptyMVTArrayBuffer = new Uint8Array();
  const geometryBinary = await parse(emptyMVTArrayBuffer, MVTLoader, {gis: {format: 'binary'}});
  t.ok(geometryBinary.points);
  t.ok(geometryBinary.lines);
  t.ok(geometryBinary.polygons);
  t.ok(geometryBinary.points.positions.size === 2);
  t.ok(geometryBinary.lines.positions.size === 2);
  t.ok(geometryBinary.polygons.positions.size === 2);

  t.end();
});

test('Triangulation is supported', async (t) => {
  const response = await fetchFile(MVT_POLYGONS_DATA_URL);
  const mvtArrayBuffer = await response.arrayBuffer();
  const geometry = await parse(mvtArrayBuffer, MVTLoader, {
    gis: {format: 'binary'}
  });

  // Closed polygon with 31 vertices (0===30)
  t.ok(geometry.polygons.positions);
  t.equals(geometry.polygons.positions.value.length, 62);

  t.ok(geometry.polygons.triangles);
  t.equals(geometry.polygons.triangles.value.length, 84);

  // Basic check that triangulation is valid
  const minI = Math.min(...geometry.polygons.triangles.value);
  const maxI = Math.max(...geometry.polygons.triangles.value);
  t.equals(minI, 0);
  t.equals(maxI, 29); // Don't expect to find 30 as closed polygon

  t.end();
});

test('Rings - single ring', async (t) => {
  const geom = {...ringsSingleRing};
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539]]);
  t.deepEqual(classified.lines, [[0]]);
  t.end();
});

test('Rings - ring and hole', async (t) => {
  const geom = {...ringsRingAndHole};
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539, 0.001363515853881836]]);
  t.deepEqual(classified.lines, [[0, 10]]);
  t.end();
});

test('Rings - two rings', async (t) => {
  const geom = {...ringsTwoRings};
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539], [-0.001363515853881836]]);
  t.deepEqual(classified.lines, [[0], [10]]);
  t.end();
});

test('Rings - zero sized hole', async (t) => {
  // In addition to checking the result,
  // verify that the data array is shortened
  const geom = {...ringsZeroSizeHole};
  t.equal(geom.data.length, 20);
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.44582176208496094]]);
  t.deepEqual(classified.lines, [[0]]);
  t.equal(classified.data.length, 12);
  t.end();
});
