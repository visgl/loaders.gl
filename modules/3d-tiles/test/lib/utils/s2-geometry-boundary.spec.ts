// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import Long from 'long';
import {
  FaceUVToXYZ,
  getCornerLngLats,
  getS2CellFromQuadKey,
  getS2CellIdFromQuadkey,
  getS2LngLatFromS2Cell,
  getS2QuadkeyFromCellId,
  IJToST,
  STToUV,
  XYZToLngLat
} from '../../../src/lib/utils/s2/s2geometry/s2-geometry';
import {
  getS2CellIdFromToken,
  getS2ChildCellId,
  getS2TokenFromCellId
} from '../../../src/lib/utils/s2/s2-token-functions';
import {getS2Cell, getS2QuadKey} from '../../../src/lib/utils/s2/s2geometry/s2-cell-utils';
import {getS2BoundaryFlatFromS2Cell} from '../../../src/lib/utils/s2/converters/s2-to-boundary';
import {getS2Region} from '../../../src/lib/utils/s2/converters/s2-to-region';
import {getS2OrientedBoundingBoxCornerPoints} from '../../../src/lib/utils/s2/converters/s2-to-obb-points';
import {convertS2BoundingVolumetoOBB} from '../../../src/lib/utils/obb/s2-corners-to-obb';

test('S2 quadkeys round-trip every face and Hilbert quadrant', () => {
  for (let face = 0; face < 6; face++) {
    for (const position of ['', '0', '1', '2', '3', '01230123']) {
      const quadkey = `${face}/${position}`;
      const cellId = getS2CellIdFromQuadkey(quadkey);

      expect(getS2QuadkeyFromCellId(cellId)).toBe(quadkey);
      expect(getS2CellFromQuadKey(quadkey)).toMatchObject({face, level: position.length});
    }
  }

  expect(getS2QuadkeyFromCellId(Long.UZERO)).toBe('');
});

test('S2 quadkey validation rejects malformed faces and positions', () => {
  for (const quadkey of ['', '00/', '6/', '0/4', 'x/0']) {
    expect(() => getS2CellIdFromQuadkey(quadkey)).toThrow('Invalid Hilbert quad key');
  }
  expect(() => getS2CellFromQuadKey('')).toThrow('Invalid Hilbert quad key');
});

test('S2 coordinate transforms cover both projections and all cube faces', () => {
  expect(IJToST([1, 2], 2, [0.5, 1])).toEqual([0.375, 0.75]);
  expect(STToUV([0, 0.5])).toEqual([-1, 0]);
  expect(STToUV([0.75, 1])[0]).toBeCloseTo(5 / 12);
  expect(STToUV([0.75, 1])[1]).toBe(1);

  expect(FaceUVToXYZ(0, [2, 3])).toEqual([1, 2, 3]);
  expect(FaceUVToXYZ(1, [2, 3])).toEqual([-2, 1, 3]);
  expect(FaceUVToXYZ(2, [2, 3])).toEqual([-2, -3, 1]);
  expect(FaceUVToXYZ(3, [2, 3])).toEqual([-1, -3, -2]);
  expect(FaceUVToXYZ(4, [2, 3])).toEqual([3, -1, -2]);
  expect(FaceUVToXYZ(5, [2, 3])).toEqual([3, 2, -1]);
  expect(() => FaceUVToXYZ(6, [0, 0])).toThrow('Invalid face');

  expect(XYZToLngLat([1, 0, 0])).toEqual([0, 0]);
  expect(XYZToLngLat([0, 1, 0])).toEqual([90, 0]);
});

test('S2 cells expose finite centers and four distinct corners', () => {
  for (const quadkey of ['0/0', '1/1', '2/2', '3/3', '4/0123', '5/3210']) {
    const cell = getS2CellFromQuadKey(quadkey);
    const center = getS2LngLatFromS2Cell(cell);
    const corners = getCornerLngLats(cell);

    expect(center.every(Number.isFinite)).toBe(true);
    expect(corners).toHaveLength(4);
    expect(corners.every(corner => corner.every(Number.isFinite))).toBe(true);
    expect(new Set(corners.map(String)).size).toBe(4);
  }
});

test('S2 tokens round-trip cell identifiers and derive four children', () => {
  expect(getS2CellIdFromToken('X').isZero()).toBe(true);
  expect(getS2TokenFromCellId(Long.UZERO)).toBe('X');

  for (const quadkey of ['0/', '1/0', '2/13', '3/210', '4/0123', '5/3333']) {
    const cellId = getS2CellIdFromQuadkey(quadkey);
    const token = getS2TokenFromCellId(cellId);
    expect(getS2CellIdFromToken(token).equals(cellId)).toBe(true);
    expect(getS2QuadKey(token)).toBe(quadkey);
    expect(getS2QuadKey(quadkey)).toBe(quadkey);
    expect(getS2Cell(token)).toEqual(getS2CellFromQuadKey(quadkey));
  }

  const rootCellId = getS2CellIdFromQuadkey('2/');
  const childIds = [0, 1, 2, 3].map(index => getS2ChildCellId(rootCellId, index));
  expect(childIds.map(getS2QuadkeyFromCellId).sort()).toEqual(['2/0', '2/1', '2/2', '2/3']);
});

test('S2 boundaries and regions cover equatorial and polar faces', () => {
  for (const quadkey of ['0/', '1/0123', '2/', '5/']) {
    const cell = getS2Cell(quadkey);
    const boundary = getS2BoundaryFlatFromS2Cell(cell);
    const region = getS2Region(cell);

    expect(boundary.length).toBeGreaterThanOrEqual(10);
    expect(Array.from(boundary).every(Number.isFinite)).toBe(true);
    expect(boundary.slice(0, 2)).toEqual(boundary.slice(-2));
    expect(region.west).toBeLessThanOrEqual(region.east);
    expect(region.south).toBeLessThanOrEqual(region.north);
  }
});

test('S2 volume conversion creates finite corner points and an oriented box', () => {
  const corners = getS2OrientedBoundingBoxCornerPoints('1/012', {
    minimumHeight: -10,
    maximumHeight: 100
  });
  expect(corners).toHaveLength(8);
  expect(corners.flatMap(corner => Array.from(corner)).every(Number.isFinite)).toBe(true);

  const flatCorners = getS2OrientedBoundingBoxCornerPoints('1/012');
  expect(flatCorners.every(corner => corner[2] === 0)).toBe(true);

  const box = convertS2BoundingVolumetoOBB({
    token: getS2TokenFromCellId(getS2CellIdFromQuadkey('1/012')),
    minimumHeight: -10,
    maximumHeight: 100
  });
  expect(box).toHaveLength(12);
  expect(box.every(Number.isFinite)).toBe(true);
});
