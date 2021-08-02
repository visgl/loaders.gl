import test from 'tape-promise/tape';
import {getMeshBoundingBox} from '@loaders.gl/schema';

test('getMeshBoundingBox', (t) => {
  // @ts-ignore
  t.is(getMeshBoundingBox(null), null, 'does not crash with invalid input');
  t.is(getMeshBoundingBox({}), null, 'does not crash with invalid input');
  t.is(
    // @ts-ignore
    getMeshBoundingBox({POSITION: new Float32Array(3)}),
    null,
    'does not crash with invalid input'
  );

  t.deepEqual(
    getMeshBoundingBox({
      POSITION: {value: new Float32Array([-1, 1, 2, -3, 1, 4, -2, 1, 3]), size: 3}
    }),
    [
      [-3, 1, 2],
      [-1, 1, 4]
    ],
    'returns correct bounding box'
  );

  t.is(
    getMeshBoundingBox({
      POSITION: {value: new Float32Array(0), size: 3}
    }),
    null,
    'returns empty bounding box'
  );

  t.end();
});
