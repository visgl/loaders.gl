import {getS2CellFromToken, get2dRegionFromS2Cell} from './s2-utils';
import {Vector3} from '@math.gl/core';
import {OrientedBoundingBox, makeOrientedBoundingBoxFromPoints} from '@math.gl/culling';
import Cartesian3 from './cartesian3';

export type S2BoundingVolume = {
  token: string; // This can be an S2 key or token
  minimumHeight: number;
  maximumHeight: number;
};

/**
 * Converts S2BoundingVolume to OrientedBoundingBox
 * @param {S2BoundingVolume} s2bv - s2 bounding volume to convert
 * @param {OrientedBoundingBox} [result] Optional object onto which to store the result.
 * @returns The modified result parameter or a new `OrientedBoundingBox` instance if not provided.
 */
export function convertS2BVtoBox(
  s2bv: S2BoundingVolume,
  result?: OrientedBoundingBox | undefined
): number[] {
  const min: number = s2bv.minimumHeight;
  const max: number = s2bv.maximumHeight;
  const s2cell = getS2CellFromToken(s2bv.token);
  // const corners = getCornerLngLats(s2cell);
  const region = get2dRegionFromS2Cell(s2cell);
  /*
    region is {lngWest, latSouth, lngEast, latNorth} in radians
    convert region from (radians and height) to xyz using Cartesian3.fromRadians
  */
  const W = region[0];
  const E = region[2];
  const N = region[3];
  const S = region[1];

  const points: Vector3[] = [];

  points.push(Cartesian3.convertCartToXYZ(W, N, min));
  points.push(Cartesian3.convertCartToXYZ(E, N, min));
  points.push(Cartesian3.convertCartToXYZ(E, S, min));
  points.push(Cartesian3.convertCartToXYZ(W, S, min));

  points.push(Cartesian3.convertCartToXYZ(W, N, max));
  points.push(Cartesian3.convertCartToXYZ(E, N, max));
  points.push(Cartesian3.convertCartToXYZ(E, S, max));
  points.push(Cartesian3.convertCartToXYZ(W, S, max));
  /*
    points should be an array of Vector3 (XYZ)
  */
  // Passing result===null throws an exception from makeOrientedBoundingBoxFromPoints
  const obb: OrientedBoundingBox = makeOrientedBoundingBoxFromPoints(
    points,
    result !== null ? result : undefined
  );
  const box: number[] = [...obb.center, ...obb.halfAxes];
  return box;
}
