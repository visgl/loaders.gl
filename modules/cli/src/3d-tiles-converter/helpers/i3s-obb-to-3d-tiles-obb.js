import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';

/**
 * Convert obb from i3s format (basen on quaternion) to 3d-tiles format (based on matrix)
 * @param i3SObb obb object based on quaternion https://github.com/Esri/i3s-spec/blob/master/docs/1.7/obb.cmn.md
 */
export function i3sObbTo3dTilesObb(i3SObb) {
  const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(i3SObb.center, new Vector3());
  const tiles3DObb = new OrientedBoundingBox().fromCenterHalfSizeQuaternion(
    cartesianCenter,
    i3SObb.halfSize,
    i3SObb.quaternion
  );
  return [...tiles3DObb.center, ...tiles3DObb.halfAxes.toArray()];
}
