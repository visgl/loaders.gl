// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  Bounds,
  GeoBoundingBox,
  NonGeoBoundingBox,
  TileBoundingBox,
  TileIndex,
  TileLoadProps,
  ZRange
} from './tileset-2d';
export type {
  Tileset2DAdapter,
  Tileset2DTileContext,
  Tileset2DTraversalContext
} from './tileset-2d';
export type {
  RefinementStrategy,
  RefinementStrategyFunction,
  Tileset2DBaseProps,
  Tileset2DProps,
  Tile2DListener,
  Tile2DLoadDataProps
} from './tileset-2d';
export {
  SharedTile2DHeader,
  Tileset2D,
  STRATEGY_DEFAULT,
  STRATEGY_NEVER,
  STRATEGY_REPLACE
} from './tileset-2d';
export type {
  ImageSetBaseProps,
  ImageSetListener,
  ImageSetProps,
  ImageSetRequest
} from './image-set';
export {ImageSet} from './image-set';
export type {
  RasterSetBaseProps,
  RasterSetListener,
  RasterSetProps,
  RasterSetRequest,
  RasterSetShouldRefetchArgs
} from './raster-set';
export {RasterSet} from './raster-set';

/** @deprecated Import 3D runtime symbols from `@loaders.gl/tiles-3d`. */
export {Tileset3D, TILE_TYPE, TILESET_TYPE, LOD_METRIC_TYPE} from '@loaders.gl/tiles-3d';

export {selectTileMatrixTiles, createTileMatrixTileset2DAdapter} from './tile-matrix';
export type {
  TileMatrixViewFrame,
  TileMatrixTile,
  TileMatrixSelectionOptions,
  TileMatrixTileset2DAdapterOptions,
  TileMatrixSelectionGrid
} from './tile-matrix';
