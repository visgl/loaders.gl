/* eslint-disable max-statements */
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToBinary, TEST_EXPORTS} from '@loaders.gl/gis';

const {firstPass, secondPass} = TEST_EXPORTS;

// Sample GeoJSON data derived from examples in GeoJSON specification
// https://tools.ietf.org/html/rfc7946#appendix-A
// All features have 2D coordinates
const FEATURES_2D = '@loaders.gl/gis/test/data/2d_features.json';
// All features have 3D coordinates
const FEATURES_3D = '@loaders.gl/gis/test/data/3d_features.json';
// All features have 3D coordinates
const FEATURES_MIXED = '@loaders.gl/gis/test/data/mixed_features.json';

test('gis#firstPass 2D features, no properties', async t => {
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

test('gis#firstPass 3D features, no properties', async t => {
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

test('gis#firstPass mixed-dimension features, no properties', async t => {
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
  t.end();
});

test('gis#firstPass numeric properties', async t => {
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

  const {numericPropKeys} = firstPass(features);
  t.deepEquals(numericPropKeys, ['int1', 'int2', 'float1', 'float2', 'numeric1', 'numeric2']);
  t.end();
});

test('gis#secondPass 2D features, no properties', async t => {
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

function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}
