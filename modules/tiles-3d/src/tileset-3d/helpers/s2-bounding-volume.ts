// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {getS2Bounds} from '@math.gl/dggs';
import {Ellipsoid, makeOBBFromRegion} from '@math.gl/geospatial';

/** Serialized S2 cell metadata used by 3D Tiles bounding-volume extensions. */
export type S2VolumeInfo = {
  /** S2 key or token. */
  token: string;
  /** Minimum height in meters. */
  minimumHeight: number;
  /** Maximum height in meters. */
  maximumHeight: number;
};

/**
 * Converts an S2 cell and its vertical range to the runtime oriented-box representation.
 *
 * @param s2VolumeInfo - S2 cell token and height range.
 * @returns A twelve-component center/half-axis oriented bounding box.
 */
export function convertS2BoundingVolumeToOBB(s2VolumeInfo: S2VolumeInfo): number[] {
  const [[west, south], [east, north]] = getS2Bounds(s2VolumeInfo.token);
  const orientedBoundingBox = makeOBBFromRegion(
    [west, south, east, north, s2VolumeInfo.minimumHeight, s2VolumeInfo.maximumHeight],
    Ellipsoid.WGS84,
    {units: 'degrees'}
  );
  return [...orientedBoundingBox.center, ...orientedBoundingBox.halfAxes];
}
