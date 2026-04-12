// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

import {expect, test} from 'vitest';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {HexWKBLoader} from '@loaders.gl/wkt';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

test('HexWKBLoader#2D', async () => {
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
      expect(parseSync(testCase.wkbHex, HexWKBLoader), title).toEqual(testCase.geoJSON);
    }

    // Big endian
    if (testCase.wkbHexXdr && testCase.geoJSON) {
      expect(parseSync(testCase.wkbHexXdr, HexWKBLoader), title).toEqual(testCase.geoJSON);
    }
  }
});

test('HexWKBLoader#Z', async () => {
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
      expect(parseSync(testCase.wkbHex, HexWKBLoader), testCase.wkbHex.slice(0, 60)).toEqual(testCase.geoJSON);
    }

    // Big endian
    if (testCase.wkbHexXdr && testCase.geoJSON) {
      expect(parseSync(testCase.wkbHexXdr, HexWKBLoader), testCase.wkbHexXdr.slice(0, 60)).toEqual(testCase.geoJSON);
    }
  }
});
