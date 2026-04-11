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
} from './types';
export type {
  Tileset2DAdapter,
  Tileset2DTileContext,
  Tileset2DTraversalContext
} from './adapter';
export type {Tile2DLoadDataProps} from './tile-2d-header';
export {SharedTile2DHeader} from './tile-2d-header';
export type {
  RefinementStrategy,
  RefinementStrategyFunction,
  Tileset2DBaseProps,
  Tileset2DProps,
  Tile2DListener
} from './tileset-2d';
export {
  Tileset2D,
  STRATEGY_DEFAULT,
  STRATEGY_NEVER,
  STRATEGY_REPLACE
} from './tileset-2d';
