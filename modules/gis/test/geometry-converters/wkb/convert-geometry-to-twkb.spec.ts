// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {convertGeometryToTWKB, convertTWKBToGeometry} from '@loaders.gl/gis';
import type {Geometry} from '@loaders.gl/schema';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

test('convertGeometryToTWKB matches the canonical 2D fixtures without mutating input', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const [name, testCase] of Object.entries(testCases)) {
    const geometry = structuredClone(testCase.geoJSON);
    const encoded = convertGeometryToTWKB(geometry);

    expect(new Uint8Array(encoded), name).toEqual(new Uint8Array(testCase.twkb));
    expect(geometry, `${name} input remains immutable`).toEqual(testCase.geoJSON);
  }
});

test('convertGeometryToTWKB matches the canonical Z fixtures', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const [name, testCase] of Object.entries(testCases)) {
    const encoded = convertGeometryToTWKB(structuredClone(testCase.geoJSON), {hasZ: true});
    expect(new Uint8Array(encoded), name).toEqual(new Uint8Array(testCase.twkb));
  }
});

test('convertGeometryToTWKB writes and reads ZM coordinates', () => {
  const geometry: Geometry = {
    type: 'LineString',
    coordinates: [
      [1.25, -2.5, 3, 4],
      [2.5, -1.25, 5, 8]
    ]
  };

  const encoded = convertGeometryToTWKB(geometry, {hasZ: true, hasM: true});
  expect(convertTWKBToGeometry(encoded)).toEqual(geometry);
});

test('convertGeometryToTWKB marks M-only data and rejects unsupported geometry types', () => {
  const encoded = new Uint8Array(
    convertGeometryToTWKB({type: 'Point', coordinates: [1, 2, 0, 7]}, {hasM: true})
  );

  expect(encoded[1] & 0x08).toBe(0x08);
  expect(encoded[2] & 0x02).toBe(0x02);
  expect(() => convertGeometryToTWKB({type: 'Unsupported'} as unknown as Geometry)).toThrow(
    'unsupported geometry type'
  );
});
