// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, encodeSync} from '@loaders.gl/core';
import {TWKBWriter} from '@loaders.gl/wkt';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const TWKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/twkb-testdata2d.json';
const TWKB_2D_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkt/twkb-testdata2d-nan.json';
const TWKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/twkb-testdataZ.json';
const TWKB_Z_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkt/twkb-testdataZ-nan.json';

// These legacy writer cases were previously commented out. Keep them skipped during the
// syntax migration so this change does not expand test surface area.
test.skip('TWKBWriter#2D', async () => {
  const response = await fetchFile(TWKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const testCase of Object.values(testCases)) {
    const {geoJSON, twkb} = testCase;
    const encoded = encodeSync(geoJSON, TWKBWriter, {wkb: {hasZ: false, hasM: false}});
    expect(encoded).toEqual(twkb);
  }
});

test.skip('TWKBWriter#2D NaN', async () => {
  const response = await fetchFile(TWKB_2D_NAN_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const testCase of Object.values(testCases)) {
    const {geoJSON, twkb} = testCase;
    const encoded = encodeSync(geoJSON, TWKBWriter, {wkb: {hasZ: false, hasM: false}});
    expect(encoded).toEqual(twkb);
  }
});

test.skip('TWKBWriter#Z', async () => {
  const response = await fetchFile(TWKB_Z_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const testCase of Object.values(testCases)) {
    const {geoJSON, twkb} = testCase;
    const encoded = encodeSync(geoJSON, TWKBWriter, {wkb: {hasZ: true, hasM: false}});
    expect(encoded).toEqual(twkb);
  }
});

test.skip('TWKBWriter#Z NaN', async () => {
  const response = await fetchFile(TWKB_Z_NAN_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const testCase of Object.values(testCases)) {
    const {geoJSON, twkb} = testCase;
    const encoded = encodeSync(geoJSON, TWKBWriter, {wkb: {hasZ: true, hasM: false}});
    expect(encoded).toEqual(twkb);
  }
});
