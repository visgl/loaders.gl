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
import {writeWkbHeader} from '../src/lib/geometry-converters/wkb/helpers/write-wkb-header';
import {BinaryWriter} from '../src/lib/utils/binary-writer';

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

test.each([
  [{}, 1],
  [{hasZ: true}, 1001],
  [{hasM: true}, 2001],
  [{hasZ: true, hasM: true}, 3001],
  [{hasZ: true, srid: 4326}, 0x80000001],
  [{hasM: true, srid: 4326}, 0x40000001],
  [{hasZ: true, hasM: true, srid: 4326}, 0xc0000001]
] as const)('writeWkbHeader encodes dimensional flags %#', (options, expectedType) => {
  const writer = new BinaryWriter(5);
  writeWkbHeader(writer, 1, options);
  expect(writer.dataView.getUint8(0)).toBe(1);
  expect(writer.dataView.getUint32(1, true)).toBe(expectedType);
});
