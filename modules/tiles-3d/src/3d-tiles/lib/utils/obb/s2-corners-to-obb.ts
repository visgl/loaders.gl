// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {convertS2BoundingVolumeToOBB} from '../../../../tileset-3d/helpers/s2-bounding-volume';
import type {S2VolumeInfo} from '../../../../tileset-3d/helpers/s2-bounding-volume';

export type {S2VolumeInfo};

/**
 * Converts S2VolumeInfo to OrientedBoundingBox
 * @param {S2VolumeInfo} s2VolumeInfo - s2 volume to convert
 * @returns Oriented Bounding Box of type Box
 */
export function convertS2BoundingVolumetoOBB(s2VolumeInfo: S2VolumeInfo): number[] {
  return convertS2BoundingVolumeToOBB(s2VolumeInfo);
}
