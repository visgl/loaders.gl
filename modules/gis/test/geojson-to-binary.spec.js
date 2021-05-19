/* eslint-disable max-statements */
// @ts-nocheck
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';
import {TEST_EXPORTS} from '@loaders.gl/gis/lib/geojson-to-binary';

// @ts-ignore
const {firstPass, secondPass} = TEST_EXPORTS;

// Sample GeoJSON data derived from examples in GeoJSON specification
// https://tools.ietf.org/html/rfc7946#appendix-A
// All features have 2D coordinates
const FEATURES_2D = '@loaders.gl/gis/test/data/2d_features.json';
// All features have 3D coordinates
const FEATURES_3D = '@loaders.gl/gis/test/data/3d_features.json';
// All features have 3D coordinates
const FEATURES_MIXED = '@loaders.gl/gis/test/data/mixed_features.json';

// Example GeoJSON with no properties
const GEOJSON_NO_PROPERTIES = '@loaders.gl/gis/test/data/geojson_no_properties.json';

test('gis#geojson-to-binary firstPass 2D features, no properties', async t => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const firstPassData = firstPass(features);
  const {
    pointPositionsCount,
    pointFeaturesCount,
    linePositionsCount,
    linePathsCount,
    lineFeaturesCount,
    polygonPositionsCount,
    polygonObjectsCount,
    polygonRingsCount,
    polygonFeaturesCount,
    coordLength,
    numericPropKeys
  } = firstPassData;

  t.equal(pointPositionsCount, 3);
  t.equal(pointFeaturesCount, 2);
  t.equal(linePositionsCount, 6);
  t.equal(linePathsCount, 3);
  t.equal(lineFeaturesCount, 2);
  t.equal(polygonPositionsCount, 30);
  t.equal(polygonObjectsCount, 4);
  t.equal(polygonRingsCount, 6);
  t.equal(polygonFeaturesCount, 3);
  t.equal(coordLength, 2);
  t.deepEquals(numericPropKeys, []);
  t.end();
});

test('gis#geojson-to-binary firstPass 3D features, no properties', async t => {
  const response = await fetchFile(FEATURES_3D);
  const {features} = await response.json();
  const firstPassData = firstPass(features);
  const {
    pointPositionsCount,
    pointFeaturesCount,
    linePositionsCount,
    linePathsCount,
    lineFeaturesCount,
    polygonPositionsCount,
    polygonObjectsCount,
    polygonRingsCount,
    polygonFeaturesCount,
    coordLength,
    numericPropKeys
  } = firstPassData;

  t.equal(pointPositionsCount, 3);
  t.equal(pointFeaturesCount, 2);
  t.equal(linePositionsCount, 6);
  t.equal(linePathsCount, 3);
  t.equal(lineFeaturesCount, 2);
  t.equal(polygonPositionsCount, 30);
  t.equal(polygonObjectsCount, 4);
  t.equal(polygonRingsCount, 6);
  t.equal(polygonFeaturesCount, 3);
  t.equal(coordLength, 3);
  t.deepEquals(numericPropKeys, []);
  t.end();
});

test('gis#geojson-to-binary firstPass mixed-dimension features, no properties', async t => {
  const response = await fetchFile(FEATURES_MIXED);
  const {features} = await response.json();
  const firstPassData = firstPass(features);
  const {
    pointPositionsCount,
    pointFeaturesCount,
    linePositionsCount,
    linePathsCount,
    lineFeaturesCount,
    polygonPositionsCount,
    polygonObjectsCount,
    polygonRingsCount,
    polygonFeaturesCount,
    coordLength,
    numericPropKeys
  } = firstPassData;

  t.equal(pointPositionsCount, 3);
  t.equal(pointFeaturesCount, 2);
  t.equal(linePositionsCount, 6);
  t.equal(linePathsCount, 3);
  t.equal(lineFeaturesCount, 2);
  t.equal(polygonPositionsCount, 30);
  t.equal(polygonObjectsCount, 4);
  t.equal(polygonRingsCount, 6);
  t.equal(polygonFeaturesCount, 3);
  t.equal(coordLength, 3);
  t.deepEquals(numericPropKeys, []);

  const options = {
    coordLength: firstPassData.coordLength,
    numericPropKeys: firstPassData.numericPropKeys,
    PositionDataType: Float32Array
  };
  const {points, lines, polygons} = secondPass(features, firstPassData, options);

  // 3D size
  t.equal(points.positions.size, 3);
  t.equal(lines.positions.size, 3);
  t.equal(polygons.positions.size, 3);

  // Test value equality, missing third dimension imputed as 0
  t.deepEqual(points.positions.value, [100, 0, 1, 100, 0, 0, 101, 1, 0]);
  t.deepEqual(lines.positions.value, [
    100,
    0,
    0,
    101,
    1,
    0,
    100,
    0,
    2,
    101,
    1,
    0,
    102,
    2,
    0,
    103,
    3,
    0
  ]);
  t.end();
});

test('gis#geojson-to-binary properties', async t => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();

  // Add properties to features
  // Uniform string, missing in some features
  features[0].properties.string1 = 'string';
  features[1].properties.string1 = 'string';

  // Uniform string, in all features
  for (const feature of features) {
    feature.properties.string2 = 'string';
  }

  // Mixed string/numeric, missing in some features
  features[0].properties.mixed1 = 'mixed';
  features[1].properties.mixed1 = 1;

  // Mixed string/numeric, in all features
  for (const feature of features) {
    feature.properties.mixed2 = 'string';
  }
  features[0].properties.mixed2 = 1;

  // Uniform integer, missing in some features
  features[0].properties.int1 = 0;
  features[1].properties.int1 = 1;

  // Uniform integer, in all features
  for (const feature of features) {
    feature.properties.int2 = 1;
  }

  // Uniform float, missing in some features
  features[0].properties.float1 = 3.14;
  features[1].properties.float1 = 2.14;

  // Uniform float, in all features
  for (const feature of features) {
    feature.properties.float2 = 3.14;
  }

  // Mixed int/float, missing in some features
  features[0].properties.numeric1 = 1;
  features[1].properties.numeric1 = 2.14;

  // Mixed int/float, in all features
  for (const feature of features) {
    feature.properties.numeric2 = 3.14;
  }
  features[0].properties.numeric2 = 1;

  const firstPassData = firstPass(features);
  const {numericPropKeys} = firstPassData;
  const expectedNumericPropKeys = ['int1', 'int2', 'float1', 'float2', 'numeric1', 'numeric2'];
  t.deepEquals(numericPropKeys, expectedNumericPropKeys);

  const options = {
    coordLength: firstPassData.coordLength,
    numericPropKeys: firstPassData.numericPropKeys,
    PositionDataType: Float32Array
  };
  const {points, lines, polygons} = secondPass(features, firstPassData, options);

  // Check numeric properties keys exist
  t.deepEquals(Object.keys(points.numericProps), expectedNumericPropKeys);
  t.deepEquals(Object.keys(lines.numericProps), expectedNumericPropKeys);
  t.deepEquals(Object.keys(polygons.numericProps), expectedNumericPropKeys);

  // Verify accessor size
  t.equal(points.numericProps.int1.size, 1);
  t.equal(lines.numericProps.int1.size, 1);
  t.equal(polygons.numericProps.int1.size, 1);

  // Verify value length
  t.equal(points.numericProps.int1.value.length, 3);
  t.equal(lines.numericProps.int1.value.length, 6);
  t.equal(polygons.numericProps.int1.value.length, 30);

  // Verify selected values
  t.deepEquals(points.numericProps.int2.value, new Float32Array(3).fill(1));
  t.deepEquals(points.numericProps.float2.value, new Float32Array(3).fill(3.14));

  // Verify point string property objects
  t.deepEquals(points.properties, [
    {
      string1: 'string',
      string2: 'string',
      mixed1: 'mixed',
      mixed2: 1
    },
    {
      string1: 'string',
      string2: 'string',
      mixed1: 1,
      mixed2: 'string'
    }
  ]);

  // Verify linestring string property objects
  t.deepEquals(lines.properties, [
    {
      string2: 'string',
      mixed2: 'string'
    },
    {
      string2: 'string',
      mixed2: 'string'
    }
  ]);
  t.end();
});

test('gis#geojson-to-binary secondPass 2D features, no properties', async t => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const firstPassData = firstPass(features);

  const options = {
    coordLength: firstPassData.coordLength,
    numericPropKeys: firstPassData.numericPropKeys,
    PositionDataType: Float32Array
  };
  const {points, lines, polygons} = secondPass(features, firstPassData, options);

  // 2D size
  t.equal(points.positions.size, 2);
  t.equal(lines.positions.size, 2);
  t.equal(polygons.positions.size, 2);

  // Other arrays have coordinate size 1
  t.equal(points.globalFeatureIds.size, 1);
  t.equal(points.featureIds.size, 1);
  t.equal(lines.pathIndices.size, 1);
  t.equal(lines.globalFeatureIds.size, 1);
  t.equal(lines.featureIds.size, 1);
  t.equal(polygons.polygonIndices.size, 1);
  t.equal(polygons.primitivePolygonIndices.size, 1);
  t.equal(polygons.globalFeatureIds.size, 1);
  t.equal(polygons.featureIds.size, 1);

  // Point value equality
  t.deepEqual(points.positions.value, [100, 0, 100, 0, 101, 1]);
  t.deepEqual(points.globalFeatureIds.value, [0, 1, 1]);

  // LineString value equality
  t.deepEqual(lines.pathIndices.value, [0, 2, 4, 6]);
  t.deepEqual(lines.positions.value, [100, 0, 101, 1, 100, 0, 101, 1, 102, 2, 103, 3]);
  t.deepEqual(lines.globalFeatureIds.value, [2, 2, 3, 3, 3, 3]);

  // Polygon value equality
  const polygonFeatures = features.filter(f =>
    ['Polygon', 'MultiPolygon'].includes(f.geometry.type)
  );
  const expectedPolygonPositions = flatten(polygonFeatures.map(f => f.geometry.coordinates));

  t.deepEqual(polygons.polygonIndices.value, [0, 5, 15, 20, 30]);
  t.deepEqual(polygons.primitivePolygonIndices.value, [0, 5, 10, 15, 20, 25, 30]);
  t.deepEqual(polygons.positions.value, Float32Array.from(expectedPolygonPositions));
  t.deepEqual(polygons.globalFeatureIds.value, [
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

test('gis#geojson-to-binary 3D features', async t => {
  const response = await fetchFile(FEATURES_3D);
  const {features} = await response.json();
  const {points, lines, polygons} = geojsonToBinary(features);

  // 3D size
  t.equal(points.positions.size, 3);
  t.equal(lines.positions.size, 3);
  t.equal(polygons.positions.size, 3);

  // Other arrays have coordinate size 1
  t.equal(points.globalFeatureIds.size, 1);
  t.equal(points.featureIds.size, 1);
  t.equal(lines.pathIndices.size, 1);
  t.equal(lines.globalFeatureIds.size, 1);
  t.equal(lines.featureIds.size, 1);
  t.equal(polygons.polygonIndices.size, 1);
  t.equal(polygons.primitivePolygonIndices.size, 1);
  t.equal(polygons.globalFeatureIds.size, 1);
  t.equal(polygons.featureIds.size, 1);

  // Point value equality
  t.deepEqual(points.positions.value, [100, 0, 1, 100, 0, 2, 101, 1, 3]);
  t.deepEqual(points.globalFeatureIds.value, [0, 1, 1]);

  // LineString value equality
  const lineFeatures = features.filter(f =>
    ['LineString', 'MultiLineString'].includes(f.geometry.type)
  );
  const expectedLinePositions = flatten(lineFeatures.map(f => f.geometry.coordinates));
  t.deepEqual(lines.pathIndices.value, [0, 2, 4, 6]);
  t.deepEqual(lines.positions.value, Float32Array.from(expectedLinePositions));
  t.deepEqual(lines.globalFeatureIds.value, [2, 2, 3, 3, 3, 3]);

  // Polygon value equality
  const polygonFeatures = features.filter(f =>
    ['Polygon', 'MultiPolygon'].includes(f.geometry.type)
  );
  const expectedPolygonPositions = flatten(polygonFeatures.map(f => f.geometry.coordinates));
  t.deepEqual(polygons.polygonIndices.value, [0, 5, 15, 20, 30]);
  t.deepEqual(polygons.primitivePolygonIndices.value, [0, 5, 10, 15, 20, 25, 30]);
  t.deepEqual(polygons.positions.value, Float32Array.from(expectedPolygonPositions));
  t.end();
});

// eslint-disable-next-line complexity
test('gis#geojson-to-binary position, featureId data types', async t => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();

  // Duplicate features so that there are >65535 total features but <65535 of
  // any one geometry type
  const duplicateCount = 65535 * 2;
  const testFeatures = [];
  for (let i = 0; i < duplicateCount; i++) {
    testFeatures.push(features[i % features.length]);
  }

  const options = {PositionDataType: Float64Array};
  const {points, lines, polygons} = geojsonToBinary(testFeatures, options);

  t.ok(points && points.positions.value instanceof Float64Array);
  t.ok(points && points.globalFeatureIds.value instanceof Uint32Array);
  t.ok(points && points.featureIds.value instanceof Uint16Array);
  t.ok(lines && lines.positions.value instanceof Float64Array);
  t.ok(lines && lines.globalFeatureIds.value instanceof Uint32Array);
  t.ok(lines && lines.featureIds.value instanceof Uint16Array);
  t.ok(lines && lines.pathIndices.value instanceof Uint32Array);
  t.ok(polygons && polygons.positions.value instanceof Float64Array);
  t.ok(polygons && polygons.globalFeatureIds.value instanceof Uint32Array);
  t.ok(polygons && polygons.featureIds.value instanceof Uint16Array);
  t.ok(polygons && polygons.polygonIndices.value instanceof Uint32Array);
  t.ok(polygons && polygons.primitivePolygonIndices.value instanceof Uint32Array);
  t.end();
});

test('gis#geojson-to-binary with empty properties', async t => {
  const response = await fetchFile(GEOJSON_NO_PROPERTIES);
  const {features} = await response.json();
  const {points, lines, polygons} = geojsonToBinary(features);

  t.ok(points.properties[0] instanceof Object && points.properties[0].length === undefined);
  t.ok(lines.properties[0] instanceof Object && lines.properties[0].length === undefined);
  t.ok(polygons.properties[0] instanceof Object && polygons.properties[0].length === undefined);
  t.end();
});

function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}
