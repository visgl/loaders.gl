// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getTileBounds,
  getTileRange,
  isTileIndexInRange,
  selectTileMatrix
} from '@math.gl/geospatial/tile-matrix';
import type {
  TileMatrix,
  TileMatrixBounds,
  TileMatrixLimits,
  TileMatrixSet
} from '@math.gl/geospatial/tile-matrix';
import type {NonGeoBoundingBox, TileIndex} from './tileset-2d/types';
import type {GetTileDataParameters} from '@loaders.gl/core/loader-utils';

/** Renderer-independent view frame, already expressed in the grid's canonical X/Y coordinates. */
export type TileMatrixViewFrame = {
  /** Exact grid CRS identifier; no identifier equivalence or reprojection is inferred. */
  crs: string;
  /** Ordered finite [minimumX, minimumY, maximumX, maximumY] extent in grid coordinates. */
  extent: TileMatrixBounds;
  /** Positive coordinate units per pixel; both axes must meet this target. */
  resolution: number;
};

/** The geometry and coverage subset of TileGrid needed for selection. */
export type TileMatrixSelectionGrid = {
  /** Complete native geometry; absence is rejected rather than inferred from partial fields. */
  tileMatrixSet?: TileMatrixSet;
  /** Optional inclusive per-matrix coverage; an empty list means no available tiles. */
  limits?: readonly (TileMatrixLimits & {
    /** Native matrix identifier addressed by this coverage rectangle. */
    tileMatrix: string;
  })[];
};

/** A native tile request; its Cartesian bbox stays in crs, including for geographic grids. */
export type TileMatrixTile = {
  /** Native column/row and compatibility z equal to the selected matrix's array position. */
  index: TileIndex;
  /** Stable source/grid-scoped identifier, independent of numeric z or matrix ordering. */
  id: string;
  /** Required native matrix identifier; numeric index.z is not a substitute. */
  tileMatrix: string;
  /** Cartesian native-coordinate bounds, with no automatic geographic reinterpretation. */
  bbox: NonGeoBoundingBox;
  /** Native CRS of bbox; this is not necessarily a longitude/latitude bounding box. */
  crs: string;
  /** The selected level's logical width and height in pixels. */
  tileSize: readonly [number, number];
};

/** Resource budget for an eager fixed-frame selection. */
export type TileMatrixSelectionOptions = {
  /** Maximum tiles returned, default 4096. Oversized selections throw before allocation. */
  maximumTileCount?: number;
};

/**
 * Selects regular-grid tiles for an explicit native-CRS frame, with source coverage applied.
 * Uses math.gl's coarsest level meeting the target, or its finest available fallback. z is the
 * matrix's array index for compatibility; tileMatrix is authoritative. Cache ids encode the CRS,
 * native matrix id and column/row, and are scoped to this source/grid, not globally unique.
 * Returns an empty array outside the grid or available coverage. Partial geometry, coalesced
 * rows, mismatched CRS identifiers and invalid coverage reject rather than approximating XYZ.
 * This does not infer parents, transform a viewport, reproject content or configure a renderer.
 */
export function selectTileMatrixTiles(
  grid: TileMatrixSelectionGrid,
  frame: TileMatrixViewFrame,
  options: TileMatrixSelectionOptions = {}
): TileMatrixTile[] {
  const matrixSet = grid.tileMatrixSet;
  if (!matrixSet || !matrixSet.crs || frame.crs !== matrixSet.crs) {
    throw new Error('Tile selection requires complete geometry and a frame in the exact grid CRS.');
  }
  if (
    frame.extent.length !== 4 ||
    !frame.extent.every(Number.isFinite) ||
    frame.extent[0] > frame.extent[2] ||
    frame.extent[1] > frame.extent[3]
  ) {
    throw new RangeError('Tile frame extent must be finite and ordered.');
  }
  const maximumTileCount = options.maximumTileCount ?? 4096;
  if (!Number.isSafeInteger(maximumTileCount) || maximumTileCount < 0) {
    throw new RangeError('maximumTileCount must be a nonnegative safe integer.');
  }
  for (const matrix of matrixSet.matrices) {
    // Newer math.gl models can describe coalescence; this selector deliberately accepts regular grids only.
    const coalescenceBands = (matrix as TileMatrix & {variableMatrixWidths?: readonly unknown[]})
      .variableMatrixWidths;
    if (
      coalescenceBands !== undefined &&
      (!Array.isArray(coalescenceBands) || coalescenceBands.length > 0)
    ) {
      throw new Error('Regular-grid selection does not support variable-width rows.');
    }
  }
  const selectedMatrix = selectTileMatrix(matrixSet, frame.resolution);
  const coverage = new Map<string, NonNullable<TileMatrixSelectionGrid['limits']>[number]>();
  for (const limit of grid.limits ?? []) {
    const matrix = matrixSet.matrices.find(candidate => candidate.id === limit.tileMatrix);
    if (!matrix || coverage.has(limit.tileMatrix)) {
      throw new RangeError('Tile coverage must reference unique, known matrix ids.');
    }
    // math.gl validates every endpoint of the inclusive rectangle, not just these two indices.
    isTileIndexInRange(matrix, limit.minTileColumn, limit.minTileRow, limit);
    coverage.set(limit.tileMatrix, limit);
  }
  if (!selectedMatrix || (grid.limits !== undefined && !coverage.has(selectedMatrix.id))) return [];
  const range = getTileRange(selectedMatrix, frame.extent, coverage.get(selectedMatrix.id));
  if (!range) return [];
  const width = range.maxTileColumn - range.minTileColumn + 1;
  const height = range.maxTileRow - range.minTileRow + 1;
  if (width > maximumTileCount / height)
    throw new RangeError('Tile selection exceeds maximumTileCount.');
  const matrixIndex = matrixSet.matrices.indexOf(selectedMatrix);
  const tiles: TileMatrixTile[] = [];
  for (let row = range.minTileRow; row <= range.maxTileRow; row++) {
    for (let column = range.minTileColumn; column <= range.maxTileColumn; column++) {
      const [left, bottom, right, top] = getTileBounds(selectedMatrix, column, row);
      tiles.push({
        index: {x: column, y: row, z: matrixIndex},
        tileMatrix: selectedMatrix.id,
        id: JSON.stringify([matrixSet.crs, selectedMatrix.id, column, row]),
        bbox: {left, bottom, right, top},
        crs: matrixSet.crs,
        tileSize: [selectedMatrix.tileSize[0], selectedMatrix.tileSize[1]]
      } satisfies TileMatrixTile & GetTileDataParameters);
    }
  }
  return tiles;
}
