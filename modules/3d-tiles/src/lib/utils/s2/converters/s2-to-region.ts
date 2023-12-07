// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {S2Cell} from '../s2geometry/s2-geometry';
import {getS2BoundaryFlatFromS2Cell} from './s2-to-boundary';
import {getS2Cell} from '../s2geometry/s2-cell-utils';

/**
 * Converts S2 cell to the 2D region
 * @param s2cell {S2Cell} S2 cell to convert to 2D region
 * @returns 2D region as an object containing: west, north, east, south in degrees
 */
export function getS2Region(s2cell: S2Cell): {
  west: number;
  east: number;
  north: number;
  south: number;
} {
  let region;
  if (s2cell.face === 2 || s2cell.face === 5) {
    //    let corners: Float64Array;
    let corners: any = null;
    let len = 0;
    for (let i = 0; i < 4; i++) {
      const key = `${s2cell.face}/${i}`;
      const cell = getS2Cell(key);
      const corns: Float64Array = getS2BoundaryFlatFromS2Cell(cell);
      if (typeof corners === 'undefined' || corners === null)
        corners = new Float64Array(4 * corns.length);
      corners.set(corns, len);
      len += corns.length;
    }
    region = get2DRegionFromS2Corners(corners);
  } else {
    const corners: Float64Array = getS2BoundaryFlatFromS2Cell(s2cell);
    region = get2DRegionFromS2Corners(corners);
  }
  return region;
}

/**
 * Converts the S2 cell defined by its corners to the 2D region
 * @param corners {Float64Array} - a simple polygon in flat array format: [lng0, lat0, lng1, lat1, ...]
 * @returns 2D region as an object containing: west, north, east, south in degrees
 */
function get2DRegionFromS2Corners(corners: Float64Array): {
  west: number;
  east: number;
  north: number;
  south: number;
} {
  if (corners.length % 2 !== 0) {
    throw new Error('Invalid corners');
  }
  const longitudes: number[] = [];
  const latitudes: number[] = [];
  for (let i = 0; i < corners.length; i += 2) {
    longitudes.push(corners[i]);
    latitudes.push(corners[i + 1]);
  }

  longitudes.sort((a, b) => a - b);
  latitudes.sort((a, b) => a - b);

  // Return the region in degrees
  return {
    west: longitudes[0],
    east: longitudes[longitudes.length - 1],
    north: latitudes[latitudes.length - 1],
    south: latitudes[0]
  };
}
