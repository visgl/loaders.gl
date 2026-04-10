// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
import test from 'tape-promise/tape';
import {fetchFile, encodeSync} from '@loaders.gl/core';
import {WKBWriter} from '@loaders.gl/wkt';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkb-testdata2d.json';
const WKB_2D_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkb-testdata2d-nan.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkb-testdataZ.json';
const WKB_Z_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkb-testdataZ-nan.json';

test('encodeTWKB#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeSync(geoJSON, WKBWriter, {wkb: {hasZ: false, hasM: false}});
    t.deepEqual(encoded, wkb);
  }

  t.end();
});

test('encodeTWKB#2D NaN', async (t) => {
  const response = await fetchFile(WKB_2D_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeSync(geoJSON, WKBWriter, {wkb: {hasZ: false, hasM: false}});
    t.deepEqual(encoded, wkb);
  }

  t.end();
});

test('encodeTWKB#Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeSync(geoJSON, WKBWriter, {wkb: {hasZ: true, hasM: false}});
    t.deepEqual(encoded, wkb);
  }

  t.end();
});

test('encodeTWKB#Z NaN', async (t) => {
  const response = await fetchFile(WKB_Z_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeSync(geoJSON, WKBWriter, {wkb: {hasZ: true, hasM: false}});
    t.deepEqual(encoded, wkb);
  }

  t.end();
});
 */
