import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';

export function i3sObbTo3dTilesObb(i3SObb, geoidHeightModel) {
  const tiles3DCenter = [
    i3SObb.center[0],
    i3SObb.center[1],
    i3SObb.center[2] + geoidHeightModel.getHeight(i3SObb.center[1], i3SObb.center[0])
  ];
  const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(tiles3DCenter, new Vector3());
  const tiles3DObb = new OrientedBoundingBox().fromCenterHalfSizeQuaternion(
    cartesianCenter,
    i3SObb.halfSize,
    i3SObb.quaternion
  );
  return [...tiles3DObb.center, ...tiles3DObb.halfAxes.toArray()];
}
