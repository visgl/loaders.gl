import test from 'tape-promise/tape';
import {getCartographicOriginFromBoundingBox} from '../../src/utils/bounding-box-utils';
import {createProjection} from '../../src/utils/projection-utils';
import {areNumberArraysEqual} from './compareArrays';

test('bounding-box-utils#getCartographicOriginFromBoundingBox', async (t) => {
  t.deepEquals(getCartographicOriginFromBoundingBox(null), [0, 0, 0]);

  t.deepEquals(
    getCartographicOriginFromBoundingBox(null, [
      [52.1, -0.2, 33],
      [52.3, 0.2, 35]
    ]),
    [52.2, 0, 34]
  );

  const projection = createProjection(
    '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  t.ok(
    areNumberArraysEqual(
      getCartographicOriginFromBoundingBox(projection, [
        [291750, 5744750, 33],
        [291755, 5744755, 35]
      ]),
      [5.9786817797857745, 51.81475434812279, 34]
    )
  );
  t.ok(
    areNumberArraysEqual(
      projection?.project([291750, 5744750]),
      [5.978647065934338, 51.814730970044465]
    )
  );

  t.end();
});
