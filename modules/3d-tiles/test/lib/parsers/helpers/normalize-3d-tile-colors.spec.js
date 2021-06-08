/* eslint-disable max-len */
import {normalize3DTileColorAttribute} from '@loaders.gl/3d-tiles/lib/parsers/helpers/normalize-3d-tile-colors';
import test from 'tape-promise/tape';
import {GL} from '@loaders.gl/math';

const TEST_CASES = [
  {
    tile: null,
    colors: null,
    batchTable: null,
    expected: null,
    message: 'Should return null when no tile / colors'
  },
  {
    tile: {pointCount: 1},
    colors: new Uint8ClampedArray([250, 150, 50]),
    batchTable: null,
    expected: {
      type: GL.UNSIGNED_BYTE,
      size: 3,
      value: new Uint8ClampedArray([250, 150, 50]),
      normalized: true
    },
    message: 'Size should be 3 for RGB format'
  },
  {
    tile: {pointCount: 1},
    colors: new Uint8ClampedArray([250, 150, 50, 255]),
    batchTable: null,
    expected: {
      type: GL.UNSIGNED_BYTE,
      size: 4,
      value: new Uint8ClampedArray([250, 150, 50, 255]),
      normalized: true
    },
    message: 'Size should be 4 for RGBA format'
  }
  // {
  //   tile: {pointCount: 1, isRGB565: true},
  //   colors: [64678],
  //   batchTable: null,
  //   expected: {size: 3, value: new Uint8ClampedArray([250, 150, 50])},
  //   message: 'Size should be 3 for rgb565 format'
  // }
];

test('normalize3DTileColorAttribute', (t) => {
  TEST_CASES.forEach((testCase) =>
    t.deepEqual(
      normalize3DTileColorAttribute(testCase.tile, testCase.colors),
      testCase.expected,
      testCase.message
    )
  );

  t.end();
});
