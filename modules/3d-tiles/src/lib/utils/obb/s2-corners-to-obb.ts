// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// TypeScript's legacy `node` resolution does not inspect package `exports`, but this public
// subpath is resolved by the package at runtime and avoids loading unrelated DGGS decoders.
// @ts-expect-error Conditional package subpath exports require a modern module resolver.
import {getS2Bounds} from '@math.gl/dggs/s2';
import {Ellipsoid, makeOBBFromRegion} from '@math.gl/geospatial';

export type S2VolumeInfo = {
  /** S2 key or token */
  token: string;
  /** minimum height in meters */
  minimumHeight: number;
  /** maximum height in meters */
  maximumHeight: number;
};

/**
 * Converts S2VolumeInfo to OrientedBoundingBox
 * @param {S2VolumeInfo} s2VolumeInfo - s2 volume to convert
 * @returns Oriented Bounding Box of type Box
 */
export function convertS2BoundingVolumetoOBB(s2VolumeInfo: S2VolumeInfo): number[] {
  const [[west, south], [east, north]] = getS2Bounds(s2VolumeInfo.token);
  const orientedBoundingBox = makeOBBFromRegion(
    [west, south, east, north, s2VolumeInfo.minimumHeight, s2VolumeInfo.maximumHeight],
    Ellipsoid.WGS84,
    {units: 'degrees'}
  );
  return [...orientedBoundingBox.center, ...orientedBoundingBox.halfAxes];
}
