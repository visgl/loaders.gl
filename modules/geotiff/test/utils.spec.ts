import {expect, test} from 'vitest';
// @ts-ignore
import {intToRgba, isInterleaved} from '@loaders.gl/geotiff/lib/utils/tiff-utils';
test('Convert int to RGBA color', () => {
  expect(intToRgba(0)).toEqual([0, 0, 0, 0]);
  expect(intToRgba(100100)).toEqual([0, 1, 135, 4]);
});
test('isInterleaved', () => {
  expect(isInterleaved([1, 2, 400, 400, 4])).toBeTruthy();
  expect(isInterleaved([1, 2, 400, 400, 3])).toBeTruthy();
  expect(!isInterleaved([1, 2, 400, 400])).toBeTruthy();
  expect(!isInterleaved([1, 3, 4, 4000000])).toBeTruthy();
});
