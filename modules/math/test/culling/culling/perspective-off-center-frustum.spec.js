/* eslint-disable */
import test from 'tape-catch';

import {PerspectiveOffCenterFrustum} from '@loaders.gl/3d-tiles/math.gl/';

// defineSuite(
//   [
//     'Core/PerspectiveOffCenterFrustum',
//     'Core/Cartesian2',
//     'Core/Cartesian3',
//     'Core/Cartesian4',
//     'Core/Math',
//     'Core/Matrix4'
//   ],

// const frustum, planes;

// beforeEach(function() {
//   frustum = new PerspectiveOffCenterFrustum();
//   frustum.right = 1.0;
//   frustum.left = -frustum.right;
//   frustum.top = 1.0;
//   frustum.bottom = -frustum.top;
//   frustum.near = 1.0;
//   frustum.far = 2.0;
//   planes = frustum.computeCullingVolume(
//     new Cartesian3(),
//     Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3()),
//     Cartesian3.UNIT_Y
//   ).planes;
// });

test('constructs', t => {
  const options = {
    left: -1.0,
    right: 2.0,
    top: 5.0,
    bottom: -1.0,
    near: 3.0,
    far: 4.0
  };
  const f = new PerspectiveOffCenterFrustum(options);
  t.equals(f.width, options.width);
  t.equals(f.aspectRatio, options.aspectRatio);
  t.equals(f.near, options.near);
  t.equals(f.far, options.far);
  t.end();
});

test('default constructs', t => {
  const f = new PerspectiveOffCenterFrustum();
  expect(f.left).toBeUndefined();
  expect(f.right).toBeUndefined();
  expect(f.top).toBeUndefined();
  expect(f.bottom).toBeUndefined();
  t.equals(f.near, 1.0);
  t.equals(f.far, 500000000.0);
  t.end();
});

test('out of range near plane throws an exception', t => {
  frustum.near = -1.0;
  t.throws(() => frustum.projectionMatrix);
  t.end();
});

test('negative far plane throws an exception', t => {
  frustum.far = -1.0;
  t.throws(() => frustum.projectionMatrix);
  t.end();
});

test('computeCullingVolume with no position throws an exception', t => {
  t.throws(() => frustum.computeCullingVolume());
  t.end();
});

test('computeCullingVolume with no direction throws an exception', t => {
  t.throws(() => frustum.computeCullingVolume(new Cartesian3()));
  t.end();
});

test('computeCullingVolume with no up throws an exception', t => {
  t.throws(() => frustum.computeCullingVolume(new Cartesian3(), new Cartesian3()));
  t.end();
});

test('get frustum left plane', t => {
  const leftPlane = planes[0];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Cartesian4(x, 0.0, -x, 0.0);
  expect(leftPlane).toEqualEpsilon(expectedResult, CesiumMath.EPSILON15);
  t.end();
});

test('get frustum right plane', t => {
  const rightPlane = planes[1];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Cartesian4(-x, 0.0, -x, 0.0);
  expect(rightPlane).toEqualEpsilon(expectedResult, CesiumMath.EPSILON15);
  t.end();
});

test('get frustum bottom plane', t => {
  const bottomPlane = planes[2];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Cartesian4(0.0, x, -x, 0.0);
  expect(bottomPlane).toEqualEpsilon(expectedResult, CesiumMath.EPSILON15);
  t.end();
});

test('get frustum top plane', t => {
  const topPlane = planes[3];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Cartesian4(0.0, -x, -x, 0.0);
  expect(topPlane).toEqualEpsilon(expectedResult, CesiumMath.EPSILON15);
  t.end();
});

test('get frustum near plane', t => {
  const nearPlane = planes[4];
  const expectedResult = new Cartesian4(0.0, 0.0, -1.0, -1.0);
  expect(nearPlane).toEqualEpsilon(expectedResult, CesiumMath.EPSILON15);
  t.end();
});

test('get frustum far plane', t => {
  const farPlane = planes[5];
  const expectedResult = new Cartesian4(0.0, 0.0, 1.0, 2.0);
  expect(farPlane).toEqualEpsilon(expectedResult, CesiumMath.EPSILON15);
  t.end();
});

test('get perspective projection matrix', t => {
  const projectionMatrix = frustum.projectionMatrix;

  const top = frustum.top;
  const bottom = frustum.bottom;
  const right = frustum.right;
  const left = frustum.left;
  const near = frustum.near;
  const far = frustum.far;
  const expected = Matrix4.computePerspectiveOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    far,
    new Matrix4()
  );

  expect(projectionMatrix).toEqualEpsilon(expected, CesiumMath.EPSILON6);
  t.end();
});

test('get infinite perspective matrix', t => {
  const top = frustum.top;
  const bottom = frustum.bottom;
  const right = frustum.right;
  const left = frustum.left;
  const near = frustum.near;

  const expected = Matrix4.computeInfinitePerspectiveOffCenter(
    left,
    right,
    bottom,
    top,
    near,
    new Matrix4()
  );
  t.equals(expected, frustum.infiniteProjectionMatrix);
  t.end();
});

test('get pixel dimensions throws without canvas height', t => {
  t.throws(() => frustum.getPixelDimensions(1.0, undefined, 1.0, new Cartesian2()));
  t.end();
});

test('get pixel dimensions throws without canvas width', t => {
  t.throws(() => frustum.getPixelDimensions(undefined, 1.0, 1.0, new Cartesian2()));
  t.end();
});

test('get pixel dimensions throws with canvas width less than or equal to zero', t => {
  t.throws(() => frustum.getPixelDimensions(0.0, 1.0, 1.0, new Cartesian2()));
  t.end();
});

test('get pixel dimensions throws with canvas height less than or equal to zero', t => {
  t.throws(() => frustum.getPixelDimensions(1.0, 0.0, 1.0, new Cartesian2()));
  t.end();
});

test('get pixel dimensions', t => {
  const pixelSize = frustum.getPixelDimensions(1.0, 1.0, 1.0, new Cartesian2());
  t.equals(pixelSize.x, 2.0);
  t.equals(pixelSize.y, 2.0);
  t.end();
});

test('equals', t => {
  const frustum2 = new PerspectiveOffCenterFrustum();
  frustum2.right = 1.0;
  frustum2.left = -frustum.right;
  frustum2.top = 1.0;
  frustum2.bottom = -frustum.top;
  frustum2.near = 1.0;
  frustum2.far = 2.0;
  frustum2.position = new Cartesian3();
  frustum2.direction = Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3());
  frustum2.up = Cartesian3.UNIT_Y;

  t.equals(frustum, frustum2);
  t.end();
});

test('throws with undefined frustum parameters', t => {
  const frustum = new PerspectiveOffCenterFrustum();
  t.throws(() => frustum.infiniteProjectionMatrix);
  t.end();
});

test('clone', t => {
  const frustum2 = frustum.clone();
  t.equals(frustum, frustum2);
  t.end();
});

test('clone with result parameter', t => {
  const result = new PerspectiveOffCenterFrustum();
  const frustum2 = frustum.clone(result);
  expect(frustum2).toBe(result);
  t.equals(frustum, frustum2);
  t.end();
});
