import test from 'tape-promise/tape';
import {createBoundingVolume} from '../../../src/tileset/helpers/bounding-volume';
import {Matrix4} from '@math.gl/core';
import {OrientedBoundingBox} from '@math.gl/culling';
import {areNumberArraysEqual} from '../../test-utils/compareArrays';

test('Tiles bounding-volume#createBoundingVolume - should convert region to obb', (t) => {
  const result = createBoundingVolume(
    {
      region: [
        0.7853981633974483, 0.22689280275926285, 0.8028514559173916, 0.24434609527920614,
        -17.29296875, 2493.5625
      ]
    },
    new Matrix4()
  );
  t.ok(result instanceof OrientedBoundingBox);
  t.ok(
    areNumberArraysEqual(result.center, [4348195.679745842, 4424932.075472673, 1479471.892147189])
  );
  t.ok(
    areNumberArraysEqual(
      result.halfAxes,
      // prettier-ignore
      [
        -38691.151309899986, 37690.50114047807, -2.3283064365386963e-10, 
        -9209.347353689373, -9371.872726273723, 53695.496290528914, 
        1176.6872740909457, 1197.4532991172746, 403.06533637456596
      ]
    )
  );
  t.end();
});
