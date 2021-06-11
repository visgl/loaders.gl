import {Ellipsoid} from '@math.gl/geospatial';
import {Matrix4, Vector3} from '@math.gl/core';
import {assert} from '@loaders.gl/loader-utils';

export function calculateTransformProps(tileHeader, tile) {
  assert(tileHeader);
  assert(tile);

  const {rtcCenter, gltfUpAxis} = tile;
  const {
    computedTransform,
    boundingVolume: {center}
  } = tileHeader;

  let modelMatrix = new Matrix4(computedTransform);

  // Translate if appropriate
  if (rtcCenter) {
    modelMatrix.translate(rtcCenter);
  }

  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  switch (gltfUpAxis) {
    case 'Z':
      break;
    case 'Y':
      const rotationY = new Matrix4().rotateX(Math.PI / 2);
      modelMatrix = modelMatrix.multiplyRight(rotationY);
      break;
    case 'X':
      const rotationX = new Matrix4().rotateY(-Math.PI / 2);
      modelMatrix = modelMatrix.multiplyRight(rotationX);
      break;
    default:
      break;
  }

  // Scale/offset positions if normalized integers
  if (tile.isQuantized) {
    modelMatrix.translate(tile.quantizedVolumeOffset).scale(tile.quantizedVolumeScale);
  }

  // Option 1: Cartesian matrix and origin
  const cartesianOrigin = new Vector3(center);

  tile.cartesianModelMatrix = modelMatrix;
  tile.cartesianOrigin = cartesianOrigin;

  // Option 2: Cartographic matrix and origin
  const cartographicOrigin = Ellipsoid.WGS84.cartesianToCartographic(
    cartesianOrigin,
    new Vector3()
  );
  const fromFixedFrameMatrix = Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin);
  const toFixedFrameMatrix = fromFixedFrameMatrix.invert();

  tile.cartographicModelMatrix = toFixedFrameMatrix.multiplyRight(modelMatrix);
  tile.cartographicOrigin = cartographicOrigin;

  // Deprecated, drop
  tile.modelMatrix = tile.cartographicModelMatrix;
}
