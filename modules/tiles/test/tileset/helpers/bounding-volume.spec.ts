import test from 'tape-promise/tape';
import {createBoundingVolume} from '../../../src/tileset/helpers/bounding-volume';
import {Matrix4} from '@math.gl/core';
import {OrientedBoundingBox} from '@math.gl/culling';

test('Tiles bounding-volume#createBoundingVolume - should convert region to obb', (t) => {
  const result = createBoundingVolume(
    {
      region: [
        -3.1415925942485985, -1.4599681618940228, 3.141545370875028, 1.4502639200680947,
        -385.0565011513918, 5967.300616082603
      ]
    },
    new Matrix4()
  );
  t.ok(result instanceof OrientedBoundingBox);
  t.ok(result.center.every(Number.isFinite));
  t.ok(Array.from(result.halfAxes).every(Number.isFinite));
  t.end();
});
