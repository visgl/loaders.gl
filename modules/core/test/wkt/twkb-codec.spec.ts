// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {convertGeometryToTWKB, convertTWKBToGeometry, isTWKB} from '../../src/wkt/twkb';
import type {Geometry} from '@loaders.gl/core/schema';
import {parseTestCases} from '@loaders.gl/geospatial/wkt/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/geospatial/wkt/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/geospatial/wkt/test/data/wkt/wkb-testdataZ.json';

test.each([
  [WKB_2D_TEST_CASES, undefined],
  [WKB_Z_TEST_CASES, {hasZ: true}]
] as const)('TWKB encodes fixture geometry without mutating it: %s', async (fixture, options) => {
  const response = await fetchFile(fixture);
  const testCases = parseTestCases(await response.json());
  for (const [name, testCase] of Object.entries(testCases)) {
    const geometry = structuredClone(testCase.geoJSON);
    const encoded = convertGeometryToTWKB(geometry, options);
    expect(convertTWKBToGeometry(encoded), name).toEqual(convertTWKBToGeometry(testCase.twkb));
    expect(geometry, `${name} input remains immutable`).toEqual(testCase.geoJSON);
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

test('TWKB returns exactly the bytes of a canonical quantized point', () => {
  const geometry: Geometry = {type: 'Point', coordinates: [1, -2]};
  expect(new Uint8Array(convertGeometryToTWKB(geometry))).toEqual(
    Uint8Array.of(0xa1, 0, 0xc0, 0x9a, 0x0c, 0xff, 0xb4, 0x18)
  );
});

test('TWKB rejects incomplete binary headers', () => {
  expect(isTWKB(new ArrayBuffer(0))).toBe(false);
  expect(isTWKB(Uint8Array.of(1).buffer)).toBe(false);
});
