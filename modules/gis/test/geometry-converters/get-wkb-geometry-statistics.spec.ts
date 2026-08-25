// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import type {Geometry} from '@loaders.gl/schema';

import {encodeWKBGeometryValue, getWKBGeometryStatistics} from '../../src/index';

const GEOMETRY_FAMILY_CASES: Array<{geometry: Geometry; geometryType: number}> = [
  {geometry: {type: 'Point', coordinates: [1, 2]}, geometryType: 1},
  {
    geometry: {
      type: 'LineString',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    },
    geometryType: 2
  },
  {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [1, 2],
          [3, 4],
          [1, 2]
        ]
      ]
    },
    geometryType: 3
  },
  {
    geometry: {
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    },
    geometryType: 4
  },
  {
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [
          [1, 2],
          [3, 4]
        ]
      ]
    },
    geometryType: 5
  },
  {
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [1, 2],
            [3, 4],
            [1, 2]
          ]
        ]
      ]
    },
    geometryType: 6
  },
  {
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        {type: 'Point', coordinates: [1, 2]},
        {
          type: 'LineString',
          coordinates: [
            [1, 2],
            [3, 4]
          ]
        }
      ]
    },
    geometryType: 7
  }
];

test.each(GEOMETRY_FAMILY_CASES)('getWKBGeometryStatistics scans geometry family $geometry.type', ({
  geometry,
  geometryType
}) => {
  expect(getWKBGeometryStatistics(encodeWKBGeometryValue(geometry)!)).toEqual({
    geometryType,
    bbox:
      geometry.type === 'Point'
        ? {xmin: 1, xmax: 1, ymin: 2, ymax: 2}
        : {xmin: 1, xmax: 3, ymin: 2, ymax: 4}
  });
});

test('getWKBGeometryStatistics scans XYZM polygons from sliced views', () => {
  const wkb = encodeWKBGeometryValue({
    type: 'Polygon',
    coordinates: [
      [
        [-10, 2, -5, 100],
        [20, 3, 8, 50],
        [4, 30, 2, 75],
        [-10, 2, -5, 100]
      ]
    ]
  })!;
  const padded = new Uint8Array(wkb.byteLength + 8);
  padded.set(wkb, 4);

  expect(getWKBGeometryStatistics(padded.subarray(4, 4 + wkb.byteLength))).toEqual({
    geometryType: 3003,
    bbox: {
      xmin: -10,
      xmax: 20,
      ymin: 2,
      ymax: 30,
      zmin: -5,
      zmax: 8,
      mmin: 50,
      mmax: 100
    }
  });
});

test('getWKBGeometryStatistics distinguishes XYM and omits empty bounds', () => {
  const point = new Uint8Array(5 + 3 * 8);
  const pointView = new DataView(point.buffer);
  pointView.setUint8(0, 1);
  pointView.setUint32(1, 2001, true);
  pointView.setFloat64(5, 12, true);
  pointView.setFloat64(13, -4, true);
  pointView.setFloat64(21, 99, true);

  expect(getWKBGeometryStatistics(point)).toEqual({
    geometryType: 2001,
    bbox: {xmin: 12, xmax: 12, ymin: -4, ymax: -4, mmin: 99, mmax: 99}
  });
  expect(
    getWKBGeometryStatistics(encodeWKBGeometryValue({type: 'LineString', coordinates: []})!)
  ).toEqual({geometryType: 2, bbox: undefined});
});

test('getWKBGeometryStatistics scans XYZ and canonicalizes EWKB dimensional flags', () => {
  expect(
    getWKBGeometryStatistics(encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2, 3]})!)
  ).toEqual({
    geometryType: 1001,
    bbox: {xmin: 1, xmax: 1, ymin: 2, ymax: 2, zmin: 3, zmax: 3}
  });

  const ewkbPoint = new Uint8Array(1 + 4 + 4 + 4 * 8);
  const ewkbView = new DataView(ewkbPoint.buffer);
  ewkbView.setUint8(0, 1);
  ewkbView.setUint32(1, 0xe0000001, true);
  ewkbView.setUint32(5, 4326, true);
  ewkbView.setFloat64(9, -1, true);
  ewkbView.setFloat64(17, 2, true);
  ewkbView.setFloat64(25, 3, true);
  ewkbView.setFloat64(33, 4, true);

  expect(getWKBGeometryStatistics(ewkbPoint)).toEqual({
    geometryType: 3001,
    bbox: {xmin: -1, xmax: -1, ymin: 2, ymax: 2, zmin: 3, zmax: 3, mmin: 4, mmax: 4}
  });
});

test('getWKBGeometryStatistics ignores non-finite axes and rejects trailing bytes', () => {
  const point = new Uint8Array(5 + 4 * 8);
  const pointView = new DataView(point.buffer);
  pointView.setUint8(0, 0);
  pointView.setUint32(1, 3001, false);
  pointView.setFloat64(5, Number.NaN, false);
  pointView.setFloat64(13, 2, false);
  pointView.setFloat64(21, Number.POSITIVE_INFINITY, false);
  pointView.setFloat64(29, 4, false);

  expect(getWKBGeometryStatistics(point)).toEqual({geometryType: 3001, bbox: undefined});

  const validPoint = encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]})!;
  const pointWithTrailingByte = new Uint8Array(validPoint.byteLength + 1);
  pointWithTrailingByte.set(validPoint);
  expect(() => getWKBGeometryStatistics(pointWithTrailingByte)).toThrow(/trailing bytes/);
});
