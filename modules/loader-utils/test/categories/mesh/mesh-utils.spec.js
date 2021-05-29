import test from 'tape-promise/tape';
import {getMeshBoundingBox} from '@loaders.gl/loader-utils';

test('getMeshBoundingBox', t => {
  t.is(getMeshBoundingBox(null), null, 'does not crash with invalid input');
  t.is(getMeshBoundingBox({}), null, 'does not crash with invalid input');
  t.is(
    getMeshBoundingBox({POSITION: new Float32Array(3)}),
    null,
    'does not crash with invalid input'
  );

  t.deepEqual(
    getMeshBoundingBox({
      POSITION: {value: new Float32Array([-1, 1, 2, -3, 1, 4, -2, 1, 3])}
    }),
    [
      [-3, 1, 2],
      [-1, 1, 4]
    ],
    'returns correct bounding box'
  );

  t.is(
    getMeshBoundingBox({
      POSITION: {value: new Float32Array(0)}
    }),
    null,
    'returns empty bounding box'
  );

  t.end();
});
