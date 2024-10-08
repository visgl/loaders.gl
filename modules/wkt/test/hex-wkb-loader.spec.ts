// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {HexWKBLoader} from '@loaders.gl/wkt';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

test('HexWKBLoader#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // TODO - remove and fix empty handling
    if (title.startsWith('empty') || title.includes('One') || title.includes('eometryCollection')) {
      continue;
    }
    // Little endian
    if (testCase.wkbHex && testCase.geoJSON) {
      t.deepEqual(parseSync(testCase.wkbHex, HexWKBLoader), testCase.geoJSON, title);
    }

    // Big endian
    if (testCase.wkbHexXdr && testCase.geoJSON) {
      t.deepEqual(parseSync(testCase.wkbHexXdr, HexWKBLoader), testCase.geoJSON, title);
    }
  }

  t.end();
});

test('HexWKBLoader#Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // TODO - remove and fix empty handling
    if (title.startsWith('empty') || title.includes('One') || title.includes('eometryCollection')) {
      continue;
    }

    // Little endian
    if (testCase.wkbHex && testCase.geoJSON) {
      t.deepEqual(
        parseSync(testCase.wkbHex, HexWKBLoader),
        testCase.geoJSON,
        testCase.wkbHex.slice(0, 60)
      );
    }

    // Big endian
    if (testCase.wkbHexXdr && testCase.geoJSON) {
      t.deepEqual(
        parseSync(testCase.wkbHexXdr, HexWKBLoader),
        testCase.geoJSON,
        testCase.wkbHexXdr.slice(0, 60)
      );
    }
  }

  t.end();
});
