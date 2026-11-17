import {expect, test} from 'vitest';
import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';
import {createBoundingVolumes} from '../apps/tile-converter/src/i3s-converter/helpers/coordinate-converter';

test.each([0, 1, 2])('I3S bounds preserve reflected source boxes (axis %s)', (axis) => {
  const orientation = new Quaternion(0.2, 0.4, 0.4, 0.8);
  const halfAxes = new Matrix3().fromQuaternion(orientation).scale([15, 5, 1]);
  for (let row = 0; row < 3; row++) halfAxes[axis * 3 + row] *= -1;
  const original = Array.from(halfAxes);
  const center = Ellipsoid.WGS84.cartographicToCartesian([8.05, 52.27, 0]);
  const source = new OrientedBoundingBox(center, halfAxes);
  const {obb} = createBoundingVolumes(source, null);
  expect(Math.hypot(...obb.quaternion)).toBeCloseTo(1, 12);
  obb.halfSize.forEach((value, index) => expect(value).toBeCloseTo([15, 5, 1][index], 12));
  const rotation = new Matrix3().fromQuaternion(obb.quaternion);
  for (let column = 0; column < 3; column++) {
    const sourceAxis = new Vector3(halfAxes.getColumn(column)).normalize();
    expect(Math.abs(sourceAxis.dot(new Vector3(rotation.getColumn(column))))).toBeCloseTo(1, 12);
  }
  expect(Array.from(source.halfAxes)).toEqual(original);
});
