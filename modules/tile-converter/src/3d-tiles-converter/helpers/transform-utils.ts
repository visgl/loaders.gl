import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

/**
 * Calculate transformation properties to transform vertex attributes (POSITION, NORMAL, etc.)
 * from LNGLAT_OFFSET coorditantes to METER_OFFSET coordinates
 * @param boundingVolumeCenter - initialized bounding volume center of the source tile
 * @returns modelMatrix - transformation matrix to transform coordinates to cartesian coordinates
 *          cartographicOrigin - tile origin coordinates to calculate offsets
 *          cartesianOrigin - tile origin coordinates to calculate offsets
 */
export function calculateTransformProps(boundingVolumeCenter: [number, number, number]): {
  cartographicOrigin: Vector3;
  cartesianOrigin: Vector3;
} {
  const cartesianOrigin = new Vector3(boundingVolumeCenter);
  const cartographicOrigin = Ellipsoid.WGS84.cartesianToCartographic(
    cartesianOrigin,
    new Vector3()
  );

  return {
    cartesianOrigin,
    cartographicOrigin
  };
}
