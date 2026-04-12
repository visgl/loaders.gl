// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {Tileset3DProps} from './tileset-3d/common/tileset-3d';
export {Tileset3D} from './tileset-3d/common/tileset-3d';
export type {
  TileContentLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  TilesetSourceInput,
  TilesetSourceMetadata,
  TilesetSourceRequest,
  Tileset3DSource,
  TilesetSourceViewState
} from './tileset-3d/common/tileset-source';
export {isTileset3DSource} from './tileset-3d/common/tileset-source';
export {Tile3D} from './tileset-3d/common/tile-3d';
export {Tiles3DSource} from './tileset-3d/format-3d-tiles/tiles-3d-source';
export {I3SSource} from './tileset-3d/format-i3s/i3s-source';

export {TilesetTraverser} from './tileset-3d/common/tileset-traverser';
export {TilesetCache} from './tileset-3d/common/tileset-cache';

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
  RasterSetRequest
} from './raster-set';
export {RasterSet} from './raster-set';
export {createBoundingVolume} from './tileset-3d/helpers/bounding-volume';
export {calculateTransformProps} from './tileset-3d/helpers/transform-utils';

export {getFrameState} from './tileset-3d/helpers/frame-state';
export {getLodStatus} from './tileset-3d/helpers/i3s-lod';

export {
  TILE_CONTENT_STATE,
  TILE_REFINEMENT,
  TILE_TYPE,
  TILESET_TYPE,
  LOD_METRIC_TYPE
} from './constants';
