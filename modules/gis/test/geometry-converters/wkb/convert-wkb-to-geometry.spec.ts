// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {convertWKBToBinaryGeometry, convertWKBToBinaryGeometry, isWKB} from '@loaders.gl/gis';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

function normalizeTypedArrays(value: unknown): unknown {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return Array.from(value as ArrayLike<number>);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeTypedArrays(entry));
  }

  if (value && typeof value === 'object') {
    const normalizedEntries = Object.entries(value).map(([key, entry]) => [
      key,
      normalizeTypedArrays(entry)
    ]);
    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

test('convertWKBToBinaryGeometry#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  const TEST_CASES2 = {multiPolygonWithTwoPolygons: TEST_CASES.multiPolygonWithTwoPolygons};
  for (const [title, testCase] of Object.entries(TEST_CASES2)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.ok(isWKB(testCase.wkb), 'isWKB(2D)');
      const result = convertWKBToBinaryGeometry(testCase.wkb);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.ok(isWKB(testCase.wkbXdr), 'isWKB(2D)');
      const result = convertWKBToBinaryGeometry(testCase.wkbXdr);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }
  }

  t.end();
});

test('convertWKBToBinaryGeometry#Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.ok(isWKB(testCase.wkb), 'isWKB(Z)');
      const result = convertWKBToBinaryGeometry(testCase.wkb);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.ok(isWKB(testCase.wkbXdr), 'isWKB(Z)');
      const result = convertWKBToBinaryGeometry(testCase.wkbXdr);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }

    // if (testCase.wkbXdr && testCase.binary && testCase.geoJSON) {
    //   t.deepEqual(parseSync(testCase.wkbXdr, WKBLoader, {wkb: {shape: 'geometry'}}), testCase.geoJSON);
    // }
  }

  t.end();
});
