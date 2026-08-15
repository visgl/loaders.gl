// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {isTWKB} from '@loaders.gl/gis';
import {TWKBLoader} from '@loaders.gl/wkt/bundled';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

function normalizeTypedArrays(value: unknown): unknown {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return Array.from(value as ArrayLike<number>);
  }

  if (Array.isArray(value)) {
    return value.map(entry => normalizeTypedArrays(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeTypedArrays(entry)])
    );
  }

  return value;
}

test('TWKBLoader#2D', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON.type === 'GeometryCollection') {
      continue; // eslint-disable-line
    }

    // Big endian
    if (testCase.twkb && testCase.binary) {
      t.ok(isTWKB(testCase.twkb), 'isTWKB(2D)');
      const geometry = {...testCase.geoJSON};
      // TODO - Weird empty geometry case, is that coorrect per spec?
      if (
        geometry.coordinates.length === 1 &&
        // @ts-ignore
        geometry.coordinates[0].length === 1 &&
        // @ts-ignore
        geometry.coordinates[0][0].length === 0
      ) {
        geometry.coordinates = [];
      }
      t.deepEqual(parseSync(testCase.twkb, TWKBLoader), geometry);
    }
  }

  t.end();
});

test('TWKBLoader#Z', async t => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON.type === 'GeometryCollection') {
      continue;
    }

    if (testCase.twkb && testCase.geoJSON) {
      const parsedGeometry = parseSync(testCase.twkb, TWKBLoader, {
        wkb: {shape: 'geojson-geometry'}
      });
      t.deepEqual(normalizeTypedArrays(parsedGeometry), testCase.geoJSON);
    }
  }

  t.end();
});
