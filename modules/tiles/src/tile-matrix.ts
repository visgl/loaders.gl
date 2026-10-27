// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTileBounds, getTileRanges, selectTileMatrix} from '@math.gl/geospatial/tile-matrix';
import type {
  TileMatrixBounds,
  TileMatrixLimits,
  TileMatrixSet
} from '@math.gl/geospatial/tile-matrix';
import type {NonGeoBoundingBox, TileIndex} from './tileset-2d/types';
import {resolveTileGridTile, validateTileGrid} from '@loaders.gl/core/loader-utils/tile-grid';
import type {Tileset2DAdapter} from './tileset-2d/adapter';
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
 * Selects regular or coalesced-grid tiles for an explicit native-CRS frame, with source coverage applied.
 * Uses math.gl's coarsest level meeting the target, or its finest available fallback. z is the
 * matrix's array index for compatibility; tileMatrix is authoritative. Cache ids encode the CRS,
 * native matrix id and column/row, and are scoped to this source/grid, not globally unique.
 * Returns an empty array outside the grid or available coverage. Partial geometry, mismatched CRS identifiers and invalid coverage reject rather than approximating XYZ.
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
  validateTileGrid(grid);
  const selectedMatrix = selectTileMatrix(matrixSet, frame.resolution);
  const coverage = new Map<string, NonNullable<TileMatrixSelectionGrid['limits']>[number]>();
  for (const limit of grid.limits ?? []) {
    coverage.set(limit.tileMatrix, limit);
  }
  if (!selectedMatrix || (grid.limits !== undefined && !coverage.has(selectedMatrix.id))) return [];
  const ranges = getTileRanges(selectedMatrix, frame.extent, coverage.get(selectedMatrix.id));
  let tileCount = 0;
  for (const range of ranges) {
    const width = (range.maxTileColumn - range.minTileColumn) / range.columnStep + 1;
    const height = range.maxTileRow - range.minTileRow + 1;
    if (width > (maximumTileCount - tileCount) / height)
      throw new RangeError('Tile selection exceeds maximumTileCount.');
    tileCount += width * height;
  }
  const matrixIndex = matrixSet.matrices.indexOf(selectedMatrix);
  const tiles: TileMatrixTile[] = [];
  for (const range of ranges) {
    for (let row = range.minTileRow; row <= range.maxTileRow; row++) {
      for (
        let column = range.minTileColumn;
        column <= range.maxTileColumn;
        column += range.columnStep
      ) {
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
  }
  return tiles;
}

/** Options for an explicit native-frame Tileset2D traversal adapter. */
export type TileMatrixTileset2DAdapterOptions = TileMatrixSelectionOptions & {
  /**
   * Caller-owned content namespace. Change it when source, grid geometry or content dimensions
   * change; identical values intentionally share cache identity within a tileset.
   */
  cacheNamespace: string;
};

/**
 * Adapts complete TileMatrix geometry to the shared Tileset2D cache using native-CRS frames.
 * Selection, bounds, native IDs and logical dimensions come from the existing fixed-frame
 * selector. No parent relationships are inferred. The caller supplies viewport conversion and
 * an explicit namespace covering source identity, grid version and content dimensions.
 * Treat grid metadata as immutable for the lifetime of this adapter; replace the adapter and
 * namespace when the grid or content changes. This does not configure a deck.gl renderer.
 */
export function createTileMatrixTileset2DAdapter(
  grid: TileMatrixSelectionGrid,
  options: TileMatrixTileset2DAdapterOptions
): Tileset2DAdapter<TileMatrixViewFrame> {
  if (!grid.tileMatrixSet) throw new Error('TileMatrix traversal requires complete geometry.');
  validateTileGrid(grid);
  if (typeof options.cacheNamespace !== 'string' || !options.cacheNamespace.trim()) {
    throw new RangeError('TileMatrix traversal requires a nonempty cache namespace.');
  }
  const matrixSet = grid.tileMatrixSet;
  const cacheNamespace = options.cacheNamespace;
  const maximumTileCount = options.maximumTileCount;
  /** Resolves coverage and native identity, including canonical coalesced aliases. */
  function resolveMatrixIndex(index: TileIndex) {
    if (!index.tileMatrix)
      throw new RangeError('TileMatrix traversal requires a native matrix ID.');
    const matrix = matrixSet.matrices.find(candidate => candidate.id === index.tileMatrix);
    if (!matrix) throw new RangeError(`Unknown tile matrix "${index.tileMatrix}"`);
    const resolved = resolveTileGridTile(grid, {...index, tileMatrix: index.tileMatrix});
    if (!resolved) throw new RangeError('Tile is outside the matrix or advertised coverage.');
    return {matrix, resolved};
  }
  return {
    getTileIndices: ({viewState}) =>
      selectTileMatrixTiles(grid, viewState, {maximumTileCount}).map(tile => ({
        ...tile.index,
        tileMatrix: tile.tileMatrix
      })),
    resolveTileIndex: index => {
      const {matrix, resolved} = resolveMatrixIndex(index);
      return {...index, x: resolved.x, tileMatrix: matrix.id};
    },
    getTileId: index => {
      const {matrix, resolved} = resolveMatrixIndex(index);
      return JSON.stringify([cacheNamespace, matrixSet.crs, matrix.id, resolved.x, resolved.y]);
    },
    getTileBoundingBox: (_context, index) => {
      const {matrix, resolved} = resolveMatrixIndex(index);
      const [left, bottom, right, top] = getTileBounds(matrix, resolved.x, resolved.y);
      return {left, bottom, right, top};
    },
    getTileMetadata: (_context, index) => {
      const {matrix} = resolveMatrixIndex(index);
      return {tileMatrix: matrix.id, crs: matrixSet.crs, tileSize: matrix.tileSize};
    },
    getParentIndex: () => null
  };
}
