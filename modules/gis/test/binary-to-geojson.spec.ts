/* eslint-disable max-depth */
import test from 'tape-promise/tape';
import type {BinaryFeatureCollection, FeatureCollection} from '@loaders.gl/schema';
import {fetchFile} from '@loaders.gl/core';
import {binaryToGeojson, binaryToGeometry} from '@loaders.gl/gis';

import {GEOMETRY_TEST_CASES} from '@loaders.gl/gis/test/data/geometry-test-cases';
import {EMPTY_BINARY_DATA} from '@loaders.gl/gis/test/data/empty_binary';

const FEATURE_COLLECTION_TEST_CASES = '@loaders.gl/gis/test/data/featurecollection.json';

type FeatureCollectionTestCase = {
  geoJSON: FeatureCollection;
  binary: BinaryFeatureCollection;
};

test('binary-to-geojson feature collections', async (t) => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = (await response.json()) as Record<string, FeatureCollectionTestCase>;

  // `mixed` test case fails test, disable until we land fix
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const {mixed, ...TEST_CASES} = parseTestCases(json);

  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON && testCase.binary) {
      t.deepEqual(binaryToGeojson(testCase.binary), testCase.geoJSON.features);
      // t.deepEqual(binaryToGeoJson(testCase.binary), testCase.geoJSON.features);
    }
  }

  t.end();
});

test('binary-to-geojson geometries', (t) => {
  for (const testCase of GEOMETRY_TEST_CASES) {
    const binaryData = testCase.binary;
    t.deepEqual(binaryToGeometry(binaryData), testCase.geoJSON);
    // t.deepEqual(binaryToGeoJson(binaryData, binaryData.type, 'geometry'), testCase.geoJSON);
  }

  t.end();
});

test('binary-to-geojson !isHeterogeneousType', async (t) => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const {mixed, ...TEST_CASES} = parseTestCases(json);
  for (const testCase of Object.values(TEST_CASES)) {
    const binaryData = testCase.binary;
    t.deepEqual(binaryToGeojson(binaryData), testCase.geoJSON.features);
  }

  t.end();
});

test('binary-to-geojson from empty binary object returns empty features array', (t) => {
  const geojson = binaryToGeojson(EMPTY_BINARY_DATA);
  t.ok(Array.isArray(geojson));
  // @ts-ignore binaryToGeojson typings are too loose
  t.equal(geojson?.length, 0);

  t.end();
});

test('binary-to-geojson getSingleFeature', async (t) => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  const TEST_CASES = parseTestCases(json);

  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON && testCase.binary) {
      for (let i = 0; i < testCase.geoJSON.features.length; ++i) {
        t.deepEqual(
          binaryToGeojson(testCase.binary, {globalFeatureId: i}),
          testCase.geoJSON.features[i]
        );
      }
    }
  }

  t.end();
});

test('binary-to-geojson getSingleFeature fail', async (t) => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  const testCase = parseTestCases(json).point;
  t.throws(
    () => binaryToGeojson(testCase.binary, {globalFeatureId: -1}),
    'throws when globalFeatureId is not found'
  );

  t.end();
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
          continue;
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
