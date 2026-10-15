// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TerrainHeightmap} from './terrain-heightmap-types';
import type {TerrainGridMetadata, TerrainHeightGrid} from './terrain-contracts';

/**
 * Detach a decoded heightmap and its explicit georeferencing/validity into a physical grid.
 * Never derives missing data from alpha, fills holes, converts datums or exaggerates heights.
 */
export function createTerrainHeightGrid(
  heightmap: TerrainHeightmap,
  metadata: TerrainGridMetadata,
  validity?: Uint8Array
): TerrainHeightGrid {
  const {width, height} = heightmap;
  const {bounds, registration, verticalDatum} = metadata;
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 2 ||
    height < 2 ||
    !Number.isSafeInteger(width * height) ||
    heightmap.heights.length !== width * height
  ) {
    throw new RangeError('Terrain grid requires a complete heightmap of at least 2 by 2');
  }
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    bounds[0] >= bounds[2] ||
    bounds[1] >= bounds[3] ||
    !Number.isFinite(bounds[2] - bounds[0]) ||
    !Number.isFinite(bounds[3] - bounds[1])
  ) {
    throw new RangeError('Terrain grid bounds must have finite positive extent');
  }
  if (
    !['pixel-center', 'grid-node'].includes(registration) ||
    !['ellipsoidal', 'orthometric', 'unknown'].includes(verticalDatum)
  ) {
    throw new RangeError('Terrain grid registration and vertical datum must be explicit');
  }
  if (validity && validity.length !== width * height)
    throw new RangeError('Terrain grid validity must match samples');
  const heights = new Float32Array(width * height);
  const valid = new Uint8Array(width * height);
  for (let index = 0; index < heights.length; index++) {
    valid[index] = validity ? Number(validity[index] !== 0) : 1;
    heights[index] = valid[index] ? heightmap.heights[index] : NaN;
    if (valid[index] && !Number.isFinite(heights[index]))
      throw new RangeError('Valid terrain heights must be finite');
  }
  return {
    width,
    height,
    heights,
    valid,
    bounds: [bounds[0], bounds[1], bounds[2], bounds[3]],
    registration,
    verticalDatum
  };
}

/**
 * Bilinear sample of a valid physical grid. Closed footprint edges clamp to the nearest
 * pixel center. Outside points and missing nonzero-weight support return null, never zero.
 * The caller must not mutate the grid while it is shared with consumers.
 */
export function sampleTerrainHeightGrid(
  grid: TerrainHeightGrid,
  position: readonly [number, number]
): number | null {
  const [west, south, east, north] = grid.bounds;
  if (
    position.length !== 2 ||
    !position.every(Number.isFinite) ||
    position[0] < west ||
    position[0] > east ||
    position[1] < south ||
    position[1] > north
  )
    return null;
  const centered = grid.registration === 'pixel-center';
  const column = Math.max(
    0,
    Math.min(
      grid.width - 1,
      ((position[0] - west) / (east - west)) * (centered ? grid.width : grid.width - 1) -
        (centered ? 0.5 : 0)
    )
  );
  const row = Math.max(
    0,
    Math.min(
      grid.height - 1,
      ((north - position[1]) / (north - south)) * (centered ? grid.height : grid.height - 1) -
        (centered ? 0.5 : 0)
    )
  );
  const left = Math.floor(column),
    top = Math.floor(row);
  const horizontal = column - left,
    vertical = row - top;
  const samples = [
    top * grid.width + left,
    top * grid.width + Math.min(left + 1, grid.width - 1),
    Math.min(top + 1, grid.height - 1) * grid.width + left,
    Math.min(top + 1, grid.height - 1) * grid.width + Math.min(left + 1, grid.width - 1)
  ];
  const weights = [
    (1 - horizontal) * (1 - vertical),
    horizontal * (1 - vertical),
    (1 - horizontal) * vertical,
    horizontal * vertical
  ];
  let height = 0;
  for (let index = 0; index < samples.length; index++) {
    if (weights[index] === 0) continue;
    if (!grid.valid[samples[index]]) return null;
    height += grid.heights[samples[index]] * weights[index];
  }
  return height;
}
