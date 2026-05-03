import {expect, test} from 'vitest';
import {getMeshBoundingBox} from '@loaders.gl/schema-utils';
test('getMeshBoundingBox', () => {
  // @ts-ignore
  expect(getMeshBoundingBox(null), 'does not crash with invalid input').toBe(null);
  expect(getMeshBoundingBox({}), 'does not crash with invalid input').toBe(null);
  expect(
    // @ts-ignore
    getMeshBoundingBox({POSITION: new Float32Array(3)}),
    'does not crash with invalid input'
  ).toBe(null);
  expect(
    getMeshBoundingBox({
      POSITION: {value: new Float32Array([-1, 1, 2, -3, 1, 4, -2, 1, 3]), size: 3}
    }),
    'returns correct bounding box'
  ).toEqual([
    [-3, 1, 2],
    [-1, 1, 4]
  ]);
  expect(
    getMeshBoundingBox({
      POSITION: {value: new Float32Array(0), size: 3}
    }),
    'returns empty bounding box'
  ).toBe(null);
});
