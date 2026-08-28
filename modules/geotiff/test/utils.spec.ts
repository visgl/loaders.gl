import {expect, test} from 'vitest';
// @ts-ignore
import {
  ensureArray,
  getImageSize,
  intToRgba,
  isInterleaved
} from '@loaders.gl/geotiff/lib/utils/tiff-utils';
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

test('tiff utilities normalize values and image dimensions', () => {
  expect(ensureArray('value')).toEqual(['value']);
  expect(ensureArray(['value', 'other'])).toEqual(['value', 'other']);
  expect(getImageSize({shape: [2, 3, 40, 50]} as any)).toEqual({height: 40, width: 50});
  expect(getImageSize({shape: [2, 40, 50, 3]} as any)).toEqual({height: 40, width: 50});
  expect(() => intToRgba(1.5)).toThrow('Not an integer');
});
