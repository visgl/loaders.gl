import test from 'tape-promise/tape';

import {intToRgba, isInterleaved} from '@loaders.gl/zarr/lib/utils/utils';

test('Convert int to RGBA color', (t) => {
  t.plan(2);
  t.deepEqual(intToRgba(0), [0, 0, 0, 0]);
  t.deepEqual(intToRgba(100100), [0, 1, 135, 4]);
});

test('isInterleaved', (t) => {
  t.plan(4);
  t.ok(isInterleaved([1, 2, 400, 400, 4]));
  t.ok(isInterleaved([1, 2, 400, 400, 3]));
  t.ok(!isInterleaved([1, 2, 400, 400]));
  t.ok(!isInterleaved([1, 3, 4, 4000000]));
});
