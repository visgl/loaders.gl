// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TerrainHeightGrid} from './terrain-contracts';
import {TerrainHeightField} from './terrain-height-field';

/**
 * Sample physical meters across closed neighboring footprints, averaging shared edges.
 * Any contributing hole returns null. Datums must match; no wrapping or reprojection occurs.
 * Reuse TerrainHeightField rather than this convenience function for repeated queries.
 */
export function sampleTerrainNeighborhood(
  grids: readonly TerrainHeightGrid[],
  position: readonly [number, number]
): number | null {
  return new TerrainHeightField(grids).sampleHeight(position);
}

/**
 * Reconstruct explicit edge nodes from a pixel-centered grid and equal-resolution neighbors.
 * Pixel-centered inputs become (width + 1) by (height + 1); grid-node inputs retain dimensions.
 * Missing neighbors clamp to the source edge. Touching holes remain invalid, never filled.
 * Arrays are detached; heights remain physical source meters with the original vertical datum.
 */
export function resampleTerrainNodes(
  grid: TerrainHeightGrid,
  neighbors: readonly TerrainHeightGrid[] = []
): TerrainHeightGrid {
  const grids = [grid, ...new Set(neighbors.filter(neighbor => neighbor !== grid))];
  const field = new TerrainHeightField(grids);
  const [west, south, east, north] = grid.bounds;
  for (const neighbor of grids) {
    if (
      neighbor.registration !== grid.registration ||
      neighbor.width !== grid.width ||
      neighbor.height !== grid.height ||
      Math.abs((neighbor.bounds[2] - neighbor.bounds[0]) / (east - west) - 1) > 1e-8 ||
      Math.abs((neighbor.bounds[3] - neighbor.bounds[1]) / (north - south) - 1) > 1e-8
    )
      throw new RangeError('Terrain neighbors require matching resolution and registration');
  }
  const columns = grid.registration === 'pixel-center' ? grid.width : grid.width - 1;
  const rows = grid.registration === 'pixel-center' ? grid.height : grid.height - 1;
  const width = columns + 1;
  const height = rows + 1;
  const heights = new Float32Array(width * height);
  const valid = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const value = field.sampleHeight([
        west + (column / columns) * (east - west),
        north - (row / rows) * (north - south)
      ]);
      const index = row * width + column;
      heights[index] = value ?? NaN;
      valid[index] = Number(value !== null);
    }
  }
  return {
    width,
    height,
    heights,
    valid,
    bounds: [west, south, east, north],
    registration: 'grid-node',
    verticalDatum: grid.verticalDatum
  };
}
