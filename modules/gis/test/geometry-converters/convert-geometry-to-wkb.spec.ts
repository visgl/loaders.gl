// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';
import {convertGeometryToWKB} from '@loaders.gl/gis';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_2D_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d-nan.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';
const WKB_Z_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ-nan.json';

test('convertGeometryToWKB#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = convertGeometryToWKB(geoJSON);
    t.deepEqual(encoded, wkb, title);
  }

  t.end();
});

test('convertGeometryToWKB#2D NaN', async (t) => {
  const response = await fetchFile(WKB_2D_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = convertGeometryToWKB(geoJSON);
    t.deepEqual(encoded, wkb, title);
  }

  t.end();
});

test('convertGeometryToWKB#Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    // TODO - remove and fix empty handling
    if (title.startsWith('empty') || title.includes('One')) {
      continue;
    }
    const encoded = convertGeometryToWKB(geoJSON, {wkb: {hasZ: true, hasM: false}});
    t.deepEqual(encoded, wkb, title);
  }

  t.end();
});

test('convertGeometryToWKB#Z NaN', async (t) => {
  const response = await fetchFile(WKB_Z_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    // TODO - remove and fix empty handling
    if (title.startsWith('empty') || title.includes('One')) {
      continue;
    }
    const encoded = convertGeometryToWKB(geoJSON, {wkb: {hasZ: true, hasM: false}});
    t.deepEqual(encoded, wkb, title);
  }

  t.end();
});
