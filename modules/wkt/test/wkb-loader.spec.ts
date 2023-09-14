import test from 'tape-promise/tape';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {WKBLoader} from '@loaders.gl/wkt';
import {parseTestCases} from './utils/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ.json';

test('WKBLoader#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.deepEqual(parseSync(testCase.wkb, WKBLoader), testCase.binary);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.deepEqual(parseSync(testCase.wkbXdr, WKBLoader), testCase.binary);
    }
  }

  t.end();
});

test('WKBLoader#Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.deepEqual(parseSync(testCase.wkb, WKBLoader), testCase.binary);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.deepEqual(parseSync(testCase.wkbXdr, WKBLoader), testCase.binary);
    }
  }

  t.end();
});
