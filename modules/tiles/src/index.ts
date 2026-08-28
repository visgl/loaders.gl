// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {Tileset3DProps} from './tileset-3d/common/tileset-3d';
export type {FoveatedInterpolationCallback} from './tileset-3d/helpers/tiles-3d-request-priority';
export {Tileset3D} from './tileset-3d/common/tileset-3d';
export type {
  TileContentLoadResult,
  TileChildrenLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  TilesetSourceInput,
  TilesetSourceMetadata,
  TilesetSourceRequest,
  TilesetSourceResolver,
  Tileset3DSource,
  TilesetSourceViewState
} from './tileset-3d/common/tileset-source';
export {isTileset3DSource} from './tileset-3d/common/tileset-source';
export type {IndexedArchiveTilesetSourceOptions} from './tileset-3d/common/indexed-archive-tileset-source';
export {IndexedArchiveTilesetSource} from './tileset-3d/common/indexed-archive-tileset-source';
export {Tile3D} from './tileset-3d/common/tile-3d';
export type {TileChildrenState} from './tileset-3d/common/tile-3d';
export {Tiles3DSource} from './tileset-3d/format-3d-tiles/tiles-3d-source';
export type {ImplicitTilingStats} from './tileset-3d/format-3d-tiles/tiles-3d-source';
export type {
  ImplicitAvailability,
  ImplicitSubtreeReference,
  ImplicitTileCoordinates,
  ImplicitTileHeader,
  ImplicitTilingDescriptor,
  MaterializedImplicitSubtree,
  ParsedImplicitSubtree
} from './tileset-3d/format-3d-tiles/implicit-tiling';
export {
  createImplicitSubtreeReference,
  materializeImplicitSubtree,
  replaceImplicitUrlTemplate
} from './tileset-3d/format-3d-tiles/implicit-tiling';
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
  RasterSetRequest,
  RasterSetShouldRefetchArgs
} from './raster-set';
export {RasterSet} from './raster-set';
export type {
  PointCloudAttribute,
  PointCloudBoundingVolume,
  PointCloudTileContent,
  PointCloudTileHeader,
  PointCloudTilesetSource,
  PointCloudTilesetViewState,
  PointCloudCoordinateSystem
} from './point-cloud/types';
export type {PointCloudTilesetOptions} from './point-cloud/point-cloud-tileset';
export {PointCloudTileset} from './point-cloud/point-cloud-tileset';
export {PointCloudTile} from './point-cloud/point-cloud-tile';
export {createBoundingVolume} from './tileset-3d/helpers/bounding-volume';
export {calculateTransformProps} from './tileset-3d/helpers/transform-utils';

export type {
  CreateTilesetSpatialReferenceOptions,
  TilesetCoordinateFrame,
  TilesetHeightReference,
  TilesetOutputCoordinates,
  TilesetSpatialOptions,
  TilesetSpatialReference,
  TilesetSpatialReferenceProvenance,
  TilesetTargetHeightReference
} from './spatial/spatial-types';
export {
  applyTilesetSpatialOptions,
  createTilesetSpatialReference,
  markTilesetSpatialReferenceTransformed
} from './spatial/spatial-types';
export {
  get3DTilesSpatialReference,
  getI3SSpatialReference
} from './spatial/format-spatial-reference';
export {SpatialCoordinateTransformer} from './spatial/spatial-coordinate-transformer';
export {getSpatialCoordinateFrame} from './spatial/spatial-coordinate-transformer';
export type {
  I3SSpatialBounds,
  I3SSpatialObb,
  I3STransformedPositions
} from './spatial/i3s-spatial-transformer';
export {I3SSpatialTransformer} from './spatial/i3s-spatial-transformer';
export {
  getGeoidModel,
  registerGeoidModel,
  registerGeoidModelFromPgm,
  registerSpatialCrs,
  registerSpatialDatumGrid
} from './spatial/spatial-resource-registry';

export {getFrameState} from './tileset-3d/helpers/frame-state';
export type {GetFrameStateOptions} from './tileset-3d/helpers/frame-state';
export {getLodStatus} from './tileset-3d/helpers/i3s-lod';

export {
  TILE_CONTENT_STATE,
  TILE_REFINEMENT,
  TILE_TYPE,
  TILESET_TYPE,
  LOD_METRIC_TYPE
} from './constants';
