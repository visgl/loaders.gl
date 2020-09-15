import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';

export function convertCommonToI3SCoordinate(tile) {
  let radius;
  let halfSize;
  let quaternion;

  const boundingVolume = tile.boundingVolume;
  const cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(
    boundingVolume.center,
    new Vector3()
  );
  if (boundingVolume instanceof OrientedBoundingBox) {
    const halfAxes = boundingVolume.halfAxes;
    halfSize = [
      new Vector3(halfAxes[0], halfAxes[1], halfAxes[2]).len(),
      new Vector3(halfAxes[3], halfAxes[4], halfAxes[5]).len(),
      new Vector3(halfAxes[6], halfAxes[7], halfAxes[8]).len()
    ];
    radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
    quaternion = new Quaternion().fromMatrix3(halfAxes).normalize();
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
