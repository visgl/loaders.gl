import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';
// @ts-expect-error
import {GeoidHeightModel} from '@loaders.gl/tile-converter/lib/geoid-height-model';

/**
 * Convert quaternion-based OBB to half-axes-based OBB
 * @param i3SObb quaternion based OBB
 * @param geoidHeightModel the Earth Gravity Model instance
 * @returns number[12] 3DTiles OBB https://github.com/CesiumGS/3d-tiles/tree/master/specification#box
 */
export function i3sObbTo3dTilesObb(
  i3SObb: {
    center: number[];
    halfSize: number[];
    quaternion: number[];
  },
  geoidHeightModel: GeoidHeightModel
): number[] {
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
