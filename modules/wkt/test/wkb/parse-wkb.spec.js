import test from 'tape-promise/tape';
import parseWKB from '@loaders.gl/wkt/lib/parse-wkb';
import {fetchFile} from '@loaders.gl/core';
import hexStringToArrayBuffer from './hex-string-to-array-buffer';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ.json';

test('parseWKB2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.deepEqual(parseWKB(testCase.wkb), testCase.binary);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.deepEqual(parseWKB(testCase.wkbXdr), testCase.binary);
    }
  }

  t.end();
});

test('parseWKB Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.deepEqual(parseWKB(testCase.wkb), testCase.binary);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.deepEqual(parseWKB(testCase.wkbXdr), testCase.binary);
    }
  }

  t.end();
});

// Note this mutates input
function parseTestCases(testCases) {
  for (const [key, value] of Object.entries(testCases)) {
    // parse WKB hex into array buffer
    testCases[key].wkb = hexStringToArrayBuffer(value.wkb);
    testCases[key].ewkb = hexStringToArrayBuffer(value.ewkb);
    testCases[key].wkbXdr = hexStringToArrayBuffer(value.wkbXdr);
    testCases[key].ewkbXdr = hexStringToArrayBuffer(value.ewkbXdr);
    testCases[key].ewkbNoSrid = hexStringToArrayBuffer(value.ewkbNoSrid);
    testCases[key].ewkbXdrNoSrid = hexStringToArrayBuffer(value.ewkbXdrNoSrid);

    // Convert binary arrays into typedArray
    if (value.binary && 'positions' in value.binary) {
      testCases[key].binary.positions.value = new Float64Array(value.binary.positions.value);
    }
    if (value.binary && 'pathIndices' in value.binary) {
      testCases[key].binary.pathIndices.value = new Uint16Array(value.binary.pathIndices.value);
    }
    if (value.binary && 'polygonIndices' in value.binary) {
      testCases[key].binary.polygonIndices.value = new Uint16Array(
        value.binary.polygonIndices.value
      );
    }
    if (value.binary && 'primitivePolygonIndices' in value.binary) {
      testCases[key].binary.primitivePolygonIndices.value = new Uint16Array(
        value.binary.primitivePolygonIndices.value
      );
    }
  }
  return testCases;
}
