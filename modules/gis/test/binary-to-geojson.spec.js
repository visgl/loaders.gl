/** @typedef {import('@loaders.gl/gis').BinaryGeometryData} BinaryGeometryData */
/* eslint-disable max-depth */
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {binaryToGeoJson} from '@loaders.gl/gis';

import GEOMETRY_TEST_CASES from '@loaders.gl/gis/test/data/geometry';
import EMPTY_BINARY_DATA from '@loaders.gl/gis/test/data/empty_binary';

const FEATURE_COLLECTION_TEST_CASES = '@loaders.gl/gis/test/data/featurecollection.json';

test('binary-to-geojson feature collections', async t => {
  const response = await fetchFile(FEATURE_COLLECTION_TEST_CASES);
  const json = await response.json();
  const TEST_CASES = parseTestCases(json);

  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON && testCase.binary) {
      t.deepEqual(binaryToGeoJson(testCase.binary), testCase.geoJSON.features);
    }
  }

  t.end();
});

test('binary-to-geojson geometries', t => {
  for (const testCase of GEOMETRY_TEST_CASES) {
    /** @type {BinaryGeometryData} */
    // @ts-ignore
    const binaryData = testCase.binary;
    t.deepEqual(binaryToGeoJson(binaryData, binaryData.type, 'geometry'), testCase.geoJSON);
  }

  t.end();
});

test('binary-to-geojson from empty binary object returns empty features array', t => {
  const geojson = binaryToGeoJson(EMPTY_BINARY_DATA);
  t.ok(Array.isArray(geojson));
  t.equal(geojson.length, 0);

  t.end();
});

// Mutates input object
function parseTestCases(testCases) {
  for (const value of Object.values(testCases)) {
    // Convert `binary`, an object with typed arrays output, into typed arrays
    // from regular arrays
    if (value.binary) {
      for (const data of Object.values(value.binary)) {
        if (data.positions) {
          data.positions.value = new Float32Array(data.positions.value);
        }
        if (data.pathIndices) {
          data.pathIndices.value = new Uint16Array(data.pathIndices.value);
        }
        if (data.primitivePolygonIndices) {
          data.primitivePolygonIndices.value = new Uint16Array(data.primitivePolygonIndices.value);
        }
        if (data.polygonIndices) {
          data.polygonIndices.value = new Uint16Array(data.polygonIndices.value);
        }
      }
    }
  }
  return testCases;
}
