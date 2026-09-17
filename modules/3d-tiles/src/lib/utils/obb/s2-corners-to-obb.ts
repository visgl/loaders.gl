// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {convertS2BoundingVolumeToOBB, type S2VolumeInfo} from '@loaders.gl/tiles';

export type {S2VolumeInfo};

/**
 * Converts S2VolumeInfo to OrientedBoundingBox
 * @param {S2VolumeInfo} s2VolumeInfo - s2 volume to convert
 * @returns Oriented Bounding Box of type Box
 */
export function convertS2BoundingVolumetoOBB(s2VolumeInfo: S2VolumeInfo): number[] {
  return convertS2BoundingVolumeToOBB(s2VolumeInfo);
}
