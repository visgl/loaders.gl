// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToBinary, getGeometryInfo, _extractNumericPropTypes} from '@loaders.gl/gis';
// Sample GeoJSON data derived from examples in GeoJSON specification
// https://tools.ietf.org/html/rfc7946#appendix-A
// All features have 2D coordinates
const FEATURES_2D = '@loaders.gl/gis/test/data/binary-features/2d_features.json';
// All features have 3D coordinates
const FEATURES_3D = '@loaders.gl/gis/test/data/binary-features/3d_features.json';
// Some features have 3D coordinates
const FEATURES_MIXED = '@loaders.gl/gis/test/data/binary-features/mixed_features.json';
// Example GeoJSON with no properties
const GEOJSON_NO_PROPERTIES =
  '@loaders.gl/gis/test/data/binary-features/geojson_no_properties.json';
test('gis#geojson-to-binary geometry info 2D features, no properties', async () => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const geometryInfo = getGeometryInfo(features);
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
    coordLength
  } = geometryInfo;
  expect(pointPositionsCount).toBe(3);
  expect(pointFeaturesCount).toBe(2);
  expect(linePositionsCount).toBe(6);
  expect(linePathsCount).toBe(3);
  expect(lineFeaturesCount).toBe(2);
  expect(polygonPositionsCount).toBe(30);
  expect(polygonObjectsCount).toBe(4);
  expect(polygonRingsCount).toBe(6);
  expect(polygonFeaturesCount).toBe(3);
  expect(coordLength).toBe(2);
});
test('gis#geojson-to-binary geometry info 3D features, no properties', async () => {
  const response = await fetchFile(FEATURES_3D);
  const {features} = await response.json();
  const geometryInfo = getGeometryInfo(features);
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
    coordLength
  } = geometryInfo;
  expect(pointPositionsCount).toBe(3);
  expect(pointFeaturesCount).toBe(2);
  expect(linePositionsCount).toBe(6);
  expect(linePathsCount).toBe(3);
  expect(lineFeaturesCount).toBe(2);
  expect(polygonPositionsCount).toBe(30);
  expect(polygonObjectsCount).toBe(4);
  expect(polygonRingsCount).toBe(6);
  expect(polygonFeaturesCount).toBe(3);
  expect(coordLength).toBe(3);
});
test('gis#geojson-to-binary geometry info mixed-dimension features, no properties', async () => {
  const response = await fetchFile(FEATURES_MIXED);
  const {features} = await response.json();
  const geometryInfo = getGeometryInfo(features);
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
    coordLength
  } = geometryInfo;
  expect(pointPositionsCount).toBe(3);
  expect(pointFeaturesCount).toBe(2);
  expect(linePositionsCount).toBe(6);
  expect(linePathsCount).toBe(3);
  expect(lineFeaturesCount).toBe(2);
  expect(polygonPositionsCount).toBe(30);
  expect(polygonObjectsCount).toBe(4);
  expect(polygonRingsCount).toBe(6);
  expect(polygonFeaturesCount).toBe(3);
  expect(coordLength).toBe(3);
  const {points, lines, polygons} = geojsonToBinary(features);
  // 3D size
  expect(points.positions.size).toBe(3);
  expect(lines.positions.size).toBe(3);
  expect(polygons.positions.size).toBe(3);
  // Test value equality, missing third dimension imputed as 0
  expect(Array.from(points.positions.value)).toEqual([100, 0, 1, 100, 0, 0, 101, 1, 0]);
  expect(Array.from(lines.positions.value)).toEqual([
    100, 0, 0, 101, 1, 0, 100, 0, 2, 101, 1, 0, 102, 2, 0, 103, 3, 0
  ]);
});
test('gis#geojson-to-binary numericPropTypes 2D features, no properties', async () => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const numericPropTypes = _extractNumericPropTypes(features);
  expect(numericPropTypes).toEqual({});
});
test('gis#geojson-to-binary properties', async () => {
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
  // Mixed 32/64bit ints
  const LARGE = 80650000088;
  for (const feature of features) {
    feature.properties.int3 = 1;
  }
  features[1].properties.int3 = LARGE;
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
  const numericPropTypes = _extractNumericPropTypes(features);
  const expectedNumericPropTypes = {
    string1: Array,
    string2: Array,
    mixed1: Array,
    mixed2: Array,
    int1: Float32Array,
    int2: Float32Array,
    int3: Float64Array,
    float1: Float64Array,
    float2: Float64Array,
    numeric1: Float64Array,
    numeric2: Float64Array
  };
  expect(numericPropTypes).toEqual(expectedNumericPropTypes);
  const expectedNumericPropKeys = Object.keys(expectedNumericPropTypes).filter(
    k => expectedNumericPropTypes[k] !== Array
  );
  const {points, lines, polygons} = geojsonToBinary(features);
  // Check numeric properties keys exist
  expect(Object.keys(points.numericProps)).toEqual(expectedNumericPropKeys);
  expect(Object.keys(lines.numericProps)).toEqual(expectedNumericPropKeys);
  expect(Object.keys(polygons.numericProps)).toEqual(expectedNumericPropKeys);
  // Verify accessor size
  expect(points.numericProps.int1.size).toBe(1);
  expect(lines.numericProps.int1.size).toBe(1);
  expect(polygons.numericProps.int1.size).toBe(1);
  // Verify value length
  expect(points.numericProps.int1.value.length).toBe(3);
  expect(lines.numericProps.int1.value.length).toBe(6);
  expect(polygons.numericProps.int1.value.length).toBe(30);
  // Verify selected values
  expect(points.numericProps.int2.value).toEqual(new Float32Array(3).fill(1));
  expect(points.numericProps.int3.value).toEqual(new Float64Array([1, LARGE, LARGE]));
  expect(points.numericProps.float2.value).toEqual(new Float64Array(3).fill(3.14));
  // Verify point string property objects
  expect(points.properties).toEqual([
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
  expect(lines.properties).toEqual([
    {
      string2: 'string',
      mixed2: 'string'
    },
    {
      string2: 'string',
      mixed2: 'string'
    }
  ]);
});
test('gis#geojson-to-binary 2D features, no properties', async () => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const {points, lines, polygons} = geojsonToBinary(features);
  // 2D size
  expect(points.positions.size).toBe(2);
  expect(lines.positions.size).toBe(2);
  expect(polygons.positions.size).toBe(2);
  // Other arrays have coordinate size 1
  expect(points.globalFeatureIds.size).toBe(1);
  expect(points.featureIds.size).toBe(1);
  expect(lines.pathIndices.size).toBe(1);
  expect(lines.globalFeatureIds.size).toBe(1);
  expect(lines.featureIds.size).toBe(1);
  expect(polygons.polygonIndices.size).toBe(1);
  expect(polygons.primitivePolygonIndices.size).toBe(1);
  expect(polygons.globalFeatureIds.size).toBe(1);
  expect(polygons.featureIds.size).toBe(1);
  // Point value equality
  expect(Array.from(points.positions.value)).toEqual([100, 0, 100, 0, 101, 1]);
  expect(Array.from(points.globalFeatureIds.value)).toEqual([0, 1, 1]);
  // LineString value equality
  expect(Array.from(lines.pathIndices.value)).toEqual([0, 2, 4, 6]);
  expect(Array.from(lines.positions.value)).toEqual([
    100, 0, 101, 1, 100, 0, 101, 1, 102, 2, 103, 3
  ]);
  expect(Array.from(lines.globalFeatureIds.value)).toEqual([2, 2, 3, 3, 3, 3]);
  // Polygon value equality
  const polygonFeatures = features.filter(f =>
    ['Polygon', 'MultiPolygon'].includes(f.geometry.type)
  );
  const expectedPolygonPositions = flatten(polygonFeatures.map(f => f.geometry.coordinates));
  expect(Array.from(polygons.polygonIndices.value)).toEqual([0, 5, 15, 20, 30]);
  expect(Array.from(polygons.primitivePolygonIndices.value)).toEqual([0, 5, 10, 15, 20, 25, 30]);
  expect(polygons.positions.value).toEqual(Float32Array.from(expectedPolygonPositions));
  expect(Array.from(polygons.globalFeatureIds.value)).toEqual([
    4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6
  ]);
});
test('gis#geojson-to-binary 3D features', async () => {
  const response = await fetchFile(FEATURES_3D);
  const {features} = await response.json();
  const {points, lines, polygons} = geojsonToBinary(features);
  // 3D size
  expect(points.positions.size).toBe(3);
  expect(lines.positions.size).toBe(3);
  expect(polygons.positions.size).toBe(3);
  // Other arrays have coordinate size 1
  expect(points.globalFeatureIds.size).toBe(1);
  expect(points.featureIds.size).toBe(1);
  expect(lines.pathIndices.size).toBe(1);
  expect(lines.globalFeatureIds.size).toBe(1);
  expect(lines.featureIds.size).toBe(1);
  expect(polygons.polygonIndices.size).toBe(1);
  expect(polygons.primitivePolygonIndices.size).toBe(1);
  expect(polygons.globalFeatureIds.size).toBe(1);
  expect(polygons.featureIds.size).toBe(1);
  // Point value equality
  expect(Array.from(points.positions.value)).toEqual([100, 0, 1, 100, 0, 2, 101, 1, 3]);
  expect(Array.from(points.globalFeatureIds.value)).toEqual([0, 1, 1]);
  // LineString value equality
  const lineFeatures = features.filter(f =>
    ['LineString', 'MultiLineString'].includes(f.geometry.type)
  );
  const expectedLinePositions = flatten(lineFeatures.map(f => f.geometry.coordinates));
  expect(Array.from(lines.pathIndices.value)).toEqual([0, 2, 4, 6]);
  expect(lines.positions.value).toEqual(Float32Array.from(expectedLinePositions));
  expect(Array.from(lines.globalFeatureIds.value)).toEqual([2, 2, 3, 3, 3, 3]);
  // Polygon value equality
  const polygonFeatures = features.filter(f =>
    ['Polygon', 'MultiPolygon'].includes(f.geometry.type)
  );
  const expectedPolygonPositions = flatten(polygonFeatures.map(f => f.geometry.coordinates));
  expect(Array.from(polygons.polygonIndices.value)).toEqual([0, 5, 15, 20, 30]);
  expect(Array.from(polygons.primitivePolygonIndices.value)).toEqual([0, 5, 10, 15, 20, 25, 30]);
  expect(polygons.positions.value).toEqual(Float32Array.from(expectedPolygonPositions));
});
// eslint-disable-next-line complexity
test('gis#geojson-to-binary position, featureId data types', async () => {
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
  expect(points && points.positions.value instanceof Float64Array).toBeTruthy();
  expect(points && points.globalFeatureIds.value instanceof Uint32Array).toBeTruthy();
  expect(points && points.featureIds.value instanceof Uint16Array).toBeTruthy();
  expect(lines && lines.positions.value instanceof Float64Array).toBeTruthy();
  expect(lines && lines.globalFeatureIds.value instanceof Uint32Array).toBeTruthy();
  expect(lines && lines.featureIds.value instanceof Uint16Array).toBeTruthy();
  expect(lines && lines.pathIndices.value instanceof Uint32Array).toBeTruthy();
  expect(polygons && polygons.positions.value instanceof Float64Array).toBeTruthy();
  expect(polygons && polygons.globalFeatureIds.value instanceof Uint32Array).toBeTruthy();
  expect(polygons && polygons.featureIds.value instanceof Uint16Array).toBeTruthy();
  expect(polygons && polygons.polygonIndices.value instanceof Uint32Array).toBeTruthy();
  expect(polygons && polygons.primitivePolygonIndices.value instanceof Uint32Array).toBeTruthy();
});
test('gis#geojson-to-binary with empty properties', async () => {
  const response = await fetchFile(GEOJSON_NO_PROPERTIES);
  const {features} = await response.json();
  const {points, lines, polygons} = geojsonToBinary(features);
  expect(
    points.properties[0] instanceof Object && points.properties[0].length === undefined
  ).toBeTruthy();
  expect(
    lines.properties[0] instanceof Object && lines.properties[0].length === undefined
  ).toBeTruthy();
  expect(
    polygons.properties[0] instanceof Object && polygons.properties[0].length === undefined
  ).toBeTruthy();
});
test('gis#geojson-to-binary triangulation', async () => {
  const response = await fetchFile(GEOJSON_NO_PROPERTIES);
  const {features} = await response.json();
  const binary = geojsonToBinary(features);
  expect(binary.polygons.triangles).toBeTruthy();
  expect(Array.from(binary.polygons.triangles.value)).toEqual([3, 0, 1, 1, 2, 3]);
  const binaryNoTriangles = geojsonToBinary(features, {triangulate: false});
  expect(binaryNoTriangles.polygons.triangles).toBeFalsy();
});
function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}
