// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Tiles3DLoader} from './tiles-3d-loader';
export {Tile3DSubtreeLoader} from './tile-3d-subtree-loader';
export {Tiles3DArchiveFileLoader} from './3d-tiles-archive-loader';
export {Tiles3DFormat} from './tiles-3d-format';
export {Tile3DSubtreeFormat} from './tiles-3d-format';
export {ThreeTZFormat} from './tiles-3d-format';
export type {Tiles3DArchiveFileLoaderOptions} from './3d-tiles-archive-loader';
export type {Tiles3DArchiveSourceInput, Tiles3DArchiveSource} from './3d-tiles-archive-source';
export type {Tile3DWriter} from './tile-3d-writer';
export type {
  Tiles3DArchiveWriter,
  Tiles3DArchiveFiles,
  Tiles3DArchiveWriterOptions
} from './3d-tiles-archive-writer';
export type {default as Tile3DFeatureTable} from './lib/classes/tile-3d-feature-table';
export type {default as Tile3DBatchTable} from './lib/classes/tile-3d-batch-table';
export type {TILE3D_TYPE} from './lib/constants';
export type {
  CesiumIonRequestOptions,
  CesiumIonTilesetMetadata,
  resolveCesiumIonTileset
} from './lib/ion/ion';
export type {
  FeatureTableJson,
  B3DMContent,
  Tile3DBoundingVolume,
  Tiles3DTileJSON,
  Tiles3DTileJSONPostprocessed,
  Tiles3DTilesetJSON,
  Tiles3DTilesetAsset,
  Tiles3DFormatVersion,
  Tiles3DMetadataEntity,
  Tiles3DMetadataGroup,
  Tiles3DMetadataSchema,
  Tiles3DTilesetJSONPostprocessed,
  ImplicitTilingData,
  Tiles3DTileContent,
  Tiles3DVectorContent,
  Tiles3DVectorPrimitive,
  Tiles3DVectorPointPrimitive,
  Tiles3DVectorPolylinePrimitive,
  Tiles3DVectorPolygonPrimitive,
  ImplicitTilingExensionData,
  Subtree,
  Availability,
  GLTFStyleBuffer,
  GLTFStyleBufferView
} from './types';
export type {Tiles3DLoaderOptions} from './tiles-3d-loader';
export type {Tiles3DArchive} from './3d-tiles-archive/3d-tiles-archive-archive';
export type {parse3DTilesArchive} from './3d-tiles-archive/3d-tiles-archive-parser';
export type {
  getStructuralMetadataProperty,
  getStructuralMetadataRow,
  StructuralMetadataRow
} from './lib/metadata/property-table';
export type {
  createTile3DStyleInput,
  getTile3DBatchTableProperties,
  getTile3DStyleProperty,
  Tile3DBatchTableLike,
  Tile3DStyleInput,
  Tile3DStyleInputOptions,
  Tile3DStylePropertySource
} from './lib/metadata/style-input';
export type {
  Tiles3DSource,
  ImplicitTilingStats
} from '../tileset-3d/format-3d-tiles/tiles-3d-source';
export type {
  ImplicitAvailability,
  ImplicitSubtreeReference,
  ImplicitTileHeader,
  ImplicitTilingDescriptor,
  MaterializedImplicitSubtree,
  ParsedImplicitSubtree,
  createImplicitSubtreeReference,
  materializeImplicitSubtree,
  replaceImplicitUrlTemplate,
  ImplicitTileCoordinates
} from '../tileset-3d/format-3d-tiles/implicit-tiling';
