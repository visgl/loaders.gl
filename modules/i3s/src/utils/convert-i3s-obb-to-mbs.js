import {BoundingSphere} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';

export function convertI3SObbToMbs(obb) {
  const halfSize = obb.halfSize;
  const centerCartesian = Ellipsoid.WGS84.cartographicToCartesian(obb.center);
  const sphere = new BoundingSphere().fromCornerPoints(
    [
      centerCartesian[0] - halfSize[0],
      centerCartesian[1] - halfSize[1],
      centerCartesian[2] - halfSize[2]
    ],
    [
      centerCartesian[0] + halfSize[0],
      centerCartesian[1] + halfSize[1],
      centerCartesian[2] + halfSize[2]
    ]
  );
  return [...obb.center, sphere.radius];
}
