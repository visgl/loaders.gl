import {describe, expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {createBoundingVolume} from '../../../src/tileset-3d/helpers/bounding-volume';

describe('3D Tiles region bounding volumes', () => {
  test('unwraps regions that cross the antimeridian', () => {
    const boundingVolume = createBoundingVolume(
      {region: [Math.PI * (170 / 180), -0.1, -Math.PI * (170 / 180), 0.1, 0, 10]},
      new Matrix4()
    );

    expect(Math.abs(boundingVolume.center[0])).toBeGreaterThan(6_000_000);
    expect(Math.abs(boundingVolume.center[1])).toBeLessThan(100_000);
  });

  test('keeps polar regions finite', () => {
    const boundingVolume = createBoundingVolume(
      {region: [-Math.PI, Math.PI * (89 / 180), Math.PI, Math.PI * (89.9 / 180), -100, 100]},
      new Matrix4()
    );

    expect(boundingVolume.center.every(Number.isFinite)).toBe(true);
    expect(boundingVolume.halfAxes.every(Number.isFinite)).toBe(true);
  });

  test('supports regions with zero thickness', () => {
    const boundingVolume = createBoundingVolume({region: [0, 0, 0.1, 0.1, 10, 10]}, new Matrix4());

    expect(boundingVolume.center.every(Number.isFinite)).toBe(true);
    expect(boundingVolume.halfAxes.every(Number.isFinite)).toBe(true);
  });
});
