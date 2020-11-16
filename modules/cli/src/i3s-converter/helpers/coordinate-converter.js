import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';

export function convertCommonToI3SCoordinate(tile, geoidHeightModel) {
  let radius;
  let halfSize;
  let quaternion;

  const boundingVolume = tile.boundingVolume;
  const cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(
    boundingVolume.center,
    new Vector3()
  );
  cartographicCenter[2] =
    cartographicCenter[2] -
    geoidHeightModel.getHeight(cartographicCenter[1], cartographicCenter[0]);
  if (boundingVolume instanceof OrientedBoundingBox) {
    halfSize = boundingVolume.halfSize;
    radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
    quaternion = boundingVolume.quaternion;
  } else {
    radius = tile.boundingVolume.radius;
    halfSize = [radius, radius, radius];
    quaternion = new Quaternion()
      .fromMatrix3(new Matrix3([halfSize[0], 0, 0, 0, halfSize[1], 0, 0, 0, halfSize[2]]))
      .normalize();
  }

  return {
    mbs: [cartographicCenter[0], cartographicCenter[1], cartographicCenter[2], radius],
    obb: {
      center: [cartographicCenter[0], cartographicCenter[1], cartographicCenter[2]],
      halfSize,
      quaternion
    }
  };
}

export function convertCommonToI3SExtentCoordinate(tileset) {
  const cartesianCenter = tileset.cartesianCenter;
  const radius = tileset.lodMetricValue;
  const rightTop = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(cartesianCenter[0] + radius, cartesianCenter[1] + radius, cartesianCenter[2]),
    new Vector3()
  );
  const leftBottom = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(cartesianCenter[0] - radius, cartesianCenter[1] - radius, cartesianCenter[2]),
    new Vector3()
  );
  const isFirstRight = rightTop[0] < leftBottom[0];
  const isFirstTop = rightTop[1] < leftBottom[1];

  return [
    isFirstRight ? rightTop[0] : leftBottom[0],
    isFirstTop ? rightTop[1] : leftBottom[1],
    isFirstRight ? leftBottom[0] : rightTop[0],
    isFirstTop ? leftBottom[1] : rightTop[1]
  ];
}

/**
 * Creates oriented boundinb box from mbs.
 * @param {Array} mbs
 * @returns {Object} - obb
 */
export function createObbFromMbs(mbs) {
  const radius = mbs[3];
  const center = new Vector3(mbs[0], mbs[1], mbs[2]);
  const halfAxex = new Matrix3([radius, 0, 0, 0, radius, 0, 0, 0, radius]);
  return new OrientedBoundingBox(center, halfAxex);
}
