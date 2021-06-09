import test from 'tape-promise/tape';

import {intToRgba, isInterleaved} from '@loaders.gl/geotiff/lib/utils/tiff-utils';

test('Convert int to RGBA color', (t) => {
  t.deepEqual(intToRgba(0), [0, 0, 0, 0]);
  t.deepEqual(intToRgba(100100), [0, 1, 135, 4]);
  t.end();
});

test('isInterleaved', (t) => {
  t.ok(isInterleaved([1, 2, 400, 400, 4]));
  t.ok(isInterleaved([1, 2, 400, 400, 3]));
  t.ok(!isInterleaved([1, 2, 400, 400]));
  t.ok(!isInterleaved([1, 3, 4, 4000000]));
  t.end();
});
