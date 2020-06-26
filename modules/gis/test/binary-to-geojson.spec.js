import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {binaryToGeoJson} from '@loaders.gl/gis';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';

test('binary-to-geojson 2D', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON && testCase.binary) {
      t.deepEqual(binaryToGeoJson(testCase.binary), testCase.geoJSON);
    }
  }

  t.end();
});

// Mutates input object
function parseTestCases(testCases) {
  for (const [key, value] of Object.entries(testCases)) {
    // Convert `binary`, an object with typed arrays output, into typed arrays
    // from regular arrays
    if (value.binary) {
      if (value.binary.positions) {
        value.binary.positions.value = new Float32Array(value.binary.positions.value);
      }
      if (value.binary.pathIndices) {
        value.binary.pathIndices.value = new Uint16Array(value.binary.pathIndices.value);
      }
      if (value.binary.primitivePolygonIndices) {
        value.binary.primitivePolygonIndices.value = new Uint16Array(
          value.binary.primitivePolygonIndices.value
        );
      }
      if (value.binary.polygonIndices) {
        value.binary.polygonIndices.value = new Uint16Array(value.binary.polygonIndices.value);
      }
    }
  }
  return testCases;
}
