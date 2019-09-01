import {assert} from '@loaders.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Matrix4, Vector3} from 'math.gl';

export function calculateTransformProps(tileHeader, tile) {
  assert(tileHeader);
  assert(tile);

  const {rtcCenter} = tile;
  const {
    computedTransform,
    _boundingVolume: {center}
  } = tileHeader;

  let modelMatrix = new Matrix4(computedTransform);
  const cartesianOrigin = center;
  const cartographicOrigin = Ellipsoid.WGS84.cartesianToCartographic(
    cartesianOrigin,
    new Vector3()
  );

  const rotateMatrix = Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin);
  modelMatrix = new Matrix4(rotateMatrix.invert()).multiplyRight(modelMatrix);
  const rot = new Matrix4().rotateX(Math.PI / 2);
  modelMatrix = modelMatrix.multiplyRight(rot);
  if (rtcCenter) {
    modelMatrix.translate(rtcCenter);
  }

  tile.cartesianOrigin = cartesianOrigin;
  tile.cartographicOrigin = cartographicOrigin;
  tile.modelMatrix = modelMatrix;
}
