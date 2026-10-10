// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  convertToBinaryGeometry,
  convertToGeoJSON,
  convertToWKB,
  convertToWKT
} from '../src/lib/geometry-converters/convert-to-geojson';

test('legacy geometry conversion helpers cover WKT and WKB inputs', () => {
  const point = {type: 'Point', coordinates: [1, 2]} as const;
  const wkt = convertToWKT(point);
  const wkb = convertToWKB(point);

  expect(wkt).toBe('POINT (1 2)');
  expect(convertToGeoJSON(wkt)).toEqual(point);
  expect(convertToGeoJSON(wkb)).toEqual(point);
  expect(convertToBinaryGeometry(wkb).type).toBe('Point');
  expect(() => convertToGeoJSON({} as never)).toThrow(/not implemented/);
  expect(() => convertToBinaryGeometry(wkt)).toThrow(/not implemented/);
  expect(() => convertToBinaryGeometry(point)).toThrow(/not implemented/);
});
