// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Bounds, TileBoundingBox, TileIndex, ZRange} from './types';

/** Traversal inputs required by a {@link Tileset2DAdapter}. */
export type Tileset2DTraversalContext<ViewStateT> = {
  /** Consumer-defined view state used by the adapter. */
  viewState: ViewStateT;
  /** Tile size in pixels. */
  tileSize: number;
  /** Bounding box limiting tile generation. */
  extent?: Bounds | null;
  /** Minimum zoom level to request. */
  minZoom?: number;
  /** Maximum zoom level to request. */
  maxZoom?: number;
  /** Integer zoom offset applied during tile selection. */
  zoomOffset?: number;
  /** Elevation range used during geospatial tile selection. */
  zRange?: ZRange | null;
  /** Optional model matrix applied by the surrounding layer stack. */
  modelMatrix?: readonly number[] | null;
  /** Inverse of the current model matrix. */
  modelMatrixInverse?: readonly number[] | null;
};

/** Minimal tile metadata inputs required by a {@link Tileset2DAdapter}. */
export type Tileset2DTileContext<ViewStateT> = {
  /** Consumer-defined view state used by the adapter. */
  viewState: ViewStateT;
  /** Tile size in pixels. */
  tileSize: number;
};

/** Adapter used by {@link Tileset2D} to compute traversal and tile bounds. */
export type Tileset2DAdapter<ViewStateT> = {
  /** Returns tile indices that should be selected for one traversal context. */
  getTileIndices: (context: Tileset2DTraversalContext<ViewStateT>) => TileIndex[];
  /** Normalizes an index before cache lookup and source loading. */
  resolveTileIndex?: (index: TileIndex) => TileIndex;
  /** Returns a source/grid-scoped cache ID; omitted uses the legacy XYZ ID. */
  getTileId?: (index: TileIndex) => string;
  /** Returns an established parent, or null when no parent relationship is known. */
  getParentIndex?: (index: TileIndex) => TileIndex | null;
  /** Returns native metadata carried to the tile header and source request. */
  getTileMetadata?: (
    context: Tileset2DTileContext<ViewStateT>,
    index: TileIndex
  ) => {
    /** Native matrix identifier. */
    tileMatrix?: string;
    /** Native CRS identifier. */
    crs?: string;
    /** Logical tile dimensions in pixels. */
    tileSize?: readonly [number, number];
  };
  /** Returns the structured bounding box for one tile index. */
  getTileBoundingBox: (
    context: Tileset2DTileContext<ViewStateT>,
    index: TileIndex
  ) => TileBoundingBox;
};
