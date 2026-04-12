// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

import {expect, test} from 'vitest';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {isWKB} from '@loaders.gl/gis';
import {WKBLoader} from '@loaders.gl/wkt';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

test('WKBLoader#2D', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  const TEST_CASES2 = {multiPolygonWithTwoPolygons: TEST_CASES.multiPolygonWithTwoPolygons};
  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const [title, testCase] of Object.entries(TEST_CASES2)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      expect(isWKB(testCase.wkb), 'isWKB(2D)').toBeTruthy();
      const result = parseSync(testCase.wkb, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      expect(isWKB(testCase.wkbXdr), 'isWKB(2D)').toBeTruthy();
      const result = parseSync(testCase.wkbXdr, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }
  }
});

test('WKBLoader#Z', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      expect(isWKB(testCase.wkb), 'isWKB(Z)').toBeTruthy();
      // TODO - remove and fix empty handling
      if (title.startsWith('empty') || title.includes('One')) {
        continue;
      }
      const result = parseSync(testCase.wkb, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      expect(isWKB(testCase.wkbXdr), 'isWKB(Z)').toBeTruthy();
      // TODO - remove and fix empty handling
      if (title.startsWith('empty') || title.includes('One')) {
        continue;
      }
      const result = parseSync(testCase.wkbXdr, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }

    // if (testCase.wkbXdr && testCase.binary && testCase.geoJSON) {
    //   t.deepEqual(parseSync(testCase.wkbXdr, WKBLoader, {wkb: {shape: 'geometry'}}), testCase.geoJSON);
    // }
  }
});
