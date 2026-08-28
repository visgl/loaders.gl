// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {BinaryFeatureCollection, FeatureCollection} from '@loaders.gl/schema';
import {fetchFile} from '@loaders.gl/core';
import {binaryToGeojson, convertBinaryGeometryToGeometry} from '@loaders.gl/gis';
import {GEOMETRY_TEST_CASES} from '@loaders.gl/gis/test/data/binary-features/geometry-test-cases';
import {EMPTY_BINARY_DATA} from '@loaders.gl/gis/test/data/binary-features/empty_binary';
const FEATURE_COLLECTION_TEST_CASES =
  '@loaders.gl/gis/test/data/binary-features/featurecollection.json';
type FeatureCollectionTestCase = {
  geoJSON: FeatureCollection;
  binary: BinaryFeatureCollection;
};
test('binary-to-geojson feature collections', async () => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = (await response.json()) as Record<string, FeatureCollectionTestCase>;
  // `mixed` test case fails test, disable until we land fix
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const {mixed, ...TEST_CASES} = parseTestCases(json);
  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON && testCase.binary) {
      expect(binaryToGeojson(testCase.binary)).toEqual(testCase.geoJSON.features);
    }
  }
});
test('binary-to-geojson geometries', () => {
  for (const testCase of GEOMETRY_TEST_CASES) {
    const binaryData = testCase.binary;
    expect(convertBinaryGeometryToGeometry(binaryData)).toEqual(testCase.geoJSON);
  }
});
test('binary-to-geojson !isHeterogeneousType', async () => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const {mixed, ...TEST_CASES} = parseTestCases(json);
  for (const testCase of Object.values(TEST_CASES)) {
    const binaryData = testCase.binary;
    expect(binaryToGeojson(binaryData)).toEqual(testCase.geoJSON.features);
  }
});
test('binary-to-geojson from empty binary object returns empty features array', () => {
  const geojson = binaryToGeojson(EMPTY_BINARY_DATA);
  expect(Array.isArray(geojson)).toBeTruthy();
  // @ts-ignore binaryToGeojson typings are too loose
  expect(geojson?.length).toBe(0);
});
test('binary-to-geojson getSingleFeature', async () => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  const TEST_CASES = parseTestCases(json);
  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON && testCase.binary) {
      for (let i = 0; i < testCase.geoJSON.features.length; ++i) {
        expect(binaryToGeojson(testCase.binary, {globalFeatureId: i})).toEqual(
          testCase.geoJSON.features[i]
        );
      }
    }
  }
});
test('binary-to-geojson getSingleFeature fail', async () => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  const testCase = parseTestCases(json).point;
  expect(
    () => binaryToGeojson(testCase.binary, {globalFeatureId: -1}),
    'throws when globalFeatureId is not found'
  ).toThrow();
});
/** @note Mutatis mutandis - Mutates input object */
function parseTestCases(
  testCases: Record<string, FeatureCollectionTestCase>
): Record<string, FeatureCollectionTestCase> {
  for (const testCase of Object.values(testCases)) {
    // Convert `binary`, an object with typed arrays output, into typed arrays
    // from regular arrays
    if (testCase.binary) {
      for (const data of Object.values(testCase.binary)) {
        if (data === 'binary-feature-collection') {
          continue; // eslint-disable-line
        }
        if (data.positions) {
          data.positions.value = new Float32Array(data.positions.value);
        }
        // @ts-expect-error
        if (data.pathIndices) {
          // @ts-expect-error
          data.pathIndices.value = new Uint16Array(data.pathIndices.value);
        }
        // @ts-expect-error
        if (data.primitivePolygonIndices) {
          // @ts-expect-error
          data.primitivePolygonIndices.value = new Uint16Array(data.primitivePolygonIndices.value);
        }
        // @ts-expect-error
        if (data.polygonIndices) {
          // @ts-expect-error
          data.polygonIndices.value = new Uint16Array(data.polygonIndices.value);
        }
      }
    }
  }
  return testCases;
}
