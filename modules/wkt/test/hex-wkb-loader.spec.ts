// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {HexWKBLoader} from '@loaders.gl/wkt';
import {parseTestCases} from './utils/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ.json';

test('HexWKBLoader#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    if (testCase.wkbHex && testCase.binary) {
      t.deepEqual(parseSync(testCase.wkbHex, HexWKBLoader, {wkb: {shape: 'binary-geometry'}}), testCase.binary);
    }

    // Big endian
    if (testCase.wkbHexXdr && testCase.binary) {
      t.deepEqual(parseSync(testCase.wkbHexXdr, HexWKBLoader, {wkb: {shape: 'binary-geometry'}}), testCase.binary);
    }
  }

  t.end();
});

test('HexWKBLoader#Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    if (testCase.wkbHex && testCase.binary) {
      t.deepEqual(
        parseSync(testCase.wkbHex, HexWKBLoader, {wkb: {shape: 'binary-geometry'}}),
        testCase.binary,
        testCase.wkbHex.slice(0, 60)
      );
    }

    // Big endian
    if (testCase.wkbHexXdr && testCase.binary) {
      t.deepEqual(
        parseSync(testCase.wkbHexXdr, HexWKBLoader, {wkb: {shape: 'binary-geometry'}}),
        testCase.binary,
        testCase.wkbHexXdr.slice(0, 60)
      );
    }
  }

  t.end();
});
