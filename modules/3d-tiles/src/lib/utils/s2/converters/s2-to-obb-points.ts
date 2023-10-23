import {getS2Cell} from '../s2geometry/s2-cell-utils';
import {getS2Region} from './s2-to-region';
import {Vector3} from '@math.gl/core';

export type S2HeightInfo = {
  minimumHeight: number;
  maximumHeight: number;
};

/**
 * Converts S2HeightInfo to corner points of an oriented bounding box
 * Can be used to constuct an OrientedBoundingBox instance
 * @param tokenOrKey {string} A string that is the cell's hex token or the Hilbert quad key (containing /)
 * @param heightInfo {S2HeightInfo} min and max height of the box
 * @returns corner points of the oriented bounding box
 */
export function getS2OrientedBoundingBoxCornerPoints(
  tokenOrKey: string, // This can be an S2 key or token
  heightInfo?: S2HeightInfo
): Vector3[] {
  const min: number = heightInfo?.minimumHeight || 0;
  const max: number = heightInfo?.maximumHeight || 0;

  const s2cell = getS2Cell(tokenOrKey);
  const region = getS2Region(s2cell);

  // region lng/lat are in degrees
  const W = region.west;
  const S = region.south;
  const E = region.east;
  const N = region.north;

  const points: Vector3[] = [];

  points.push(new Vector3(W, N, min));
  points.push(new Vector3(E, N, min));
  points.push(new Vector3(E, S, min));
  points.push(new Vector3(W, S, min));

  points.push(new Vector3(W, N, max));
  points.push(new Vector3(E, N, max));
  points.push(new Vector3(E, S, max));
  points.push(new Vector3(W, S, max));

  return points;
}
