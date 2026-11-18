// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {HeightField, reconcileTerrainVertexTiles} from '@math.gl/geospatial/terrain';
import type {TerrainSourceTile} from './terrain-source';

/** A resident vertex-registered tile in a single, same-resolution tile matrix. */
export type TerrainSeamTile = {
  /** Native tile matrix identifier. */
  readonly matrixId: string;
  /** Integer tile column in the shared lattice. */
  readonly column: number;
  /** Integer tile row in the shared lattice. */
  readonly row: number;
  /** Cached physical source tile, never modified by reconciliation. */
  readonly tile: TerrainSourceTile;
};

/** Detached view-specific seam fields and diagnostics. */
export type TerrainSeamSnapshot = {
  /** Reconciled height fields in math.gl's deterministic tile order. */
  readonly tiles: readonly {column: number; row: number; field: HeightField}[];
  /** Count of shared vertices inspected. */
  readonly sharedVertices: number;
  /** Maximum difference between valid copies before reconciliation. */
  readonly maxHeightDifference: number;
};

/**
 * Reconcile an explicitly selected same-resolution vertex-tile set without mutating the cache.
 * The caller chooses the active tile set and applies the result to its own view. This does not
 * stitch different LOD meshes, fetch missing neighbors, or replace source tile content.
 */
export function reconcileTerrainTiles(
  tiles: readonly TerrainSeamTile[],
  options: {maxHeightDifference?: number; maxTiles?: number; maxSamples?: number} = {}
): TerrainSeamSnapshot {
  if (!tiles.length) return {tiles: [], sharedVertices: 0, maxHeightDifference: 0};
  const first = tiles[0];
  const {field} = first.tile;
  if (field.registration !== 'vertex') throw new Error('Terrain seams require vertex tiles');
  const origin: [number, number] = [0, 1].map(
    axis =>
      field.origin[axis] -
      first.column * (field.width - 1) * field.columnStep[axis] -
      first.row * (field.height - 1) * field.rowStep[axis]
  ) as [number, number];
  const input = tiles.map(({matrixId, column, row, tile}) => {
    const candidate = tile.field;
    if (
      matrixId !== first.matrixId ||
      candidate.registration !== 'vertex' ||
      candidate.width !== field.width ||
      candidate.height !== field.height ||
      candidate.heightReference !== field.heightReference ||
      candidate.diagonal !== field.diagonal ||
      candidate.columnStep.some((value, axis) => value !== field.columnStep[axis]) ||
      candidate.rowStep.some((value, axis) => value !== field.rowStep[axis])
    ) {
      throw new Error('Terrain seam tiles require one matching vertex lattice');
    }
    for (let axis = 0; axis < 2; axis++) {
      const columnOffset = column * (field.width - 1) * field.columnStep[axis];
      const rowOffset = row * (field.height - 1) * field.rowStep[axis];
      const expected = origin[axis] + columnOffset + rowOffset;
      // Include the large lattice terms: cancellation near zero can hide their roundoff.
      const tolerance =
        Number.EPSILON *
        16 *
        Math.max(
          1,
          Math.abs(origin[axis]),
          Math.abs(columnOffset),
          Math.abs(rowOffset),
          Math.abs(expected),
          Math.abs(candidate.origin[axis])
        );
      if (!Number.isFinite(expected) || Math.abs(candidate.origin[axis] - expected) > tolerance)
        throw new Error('Terrain seam tile origins do not align');
    }
    return {column, row, ...candidate.copyData()};
  });
  const result = reconcileTerrainVertexTiles(input, {
    ...options,
    width: field.width,
    height: field.height,
    origin,
    columnStep: field.columnStep,
    rowStep: field.rowStep,
    heightReference: field.heightReference
  });
  return {
    tiles: result.tiles.map(tile => ({
      column: tile.column,
      row: tile.row,
      field: new HeightField({...tile.field, diagonal: field.diagonal})
    })),
    sharedVertices: result.sharedVertices,
    maxHeightDifference: result.maxHeightDifference
  };
}
