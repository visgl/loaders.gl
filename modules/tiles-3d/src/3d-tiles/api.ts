// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {default as Tile3DFeatureTable} from './lib/classes/tile-3d-feature-table';
export {default as Tile3DBatchTable} from './lib/classes/tile-3d-batch-table';
export {TILE3D_TYPE} from './lib/constants';
export {resolveCesiumIonTileset} from './lib/ion/ion';
export {Tiles3DArchive} from './3d-tiles-archive/3d-tiles-archive-archive';
export {parse3DTilesArchive} from './3d-tiles-archive/3d-tiles-archive-parser';
export {
  getStructuralMetadataProperty,
  getStructuralMetadataRow
} from './lib/metadata/property-table';
export {
  createTile3DStyleInput,
  getTile3DBatchTableProperties,
  getTile3DStyleProperty
} from './lib/metadata/style-input';
export {
  createImplicitSubtreeReference,
  materializeImplicitSubtree,
  replaceImplicitUrlTemplate
} from '../tileset-3d/format-3d-tiles/implicit-tiling';
export type {
  Tiles3DArchiveFileLoaderOptions,
  Tiles3DArchiveSourceInput,
  Tiles3DLoaderOptions,
  Tiles3DArchiveFiles,
  Tiles3DArchiveWriterOptions,
  CesiumIonRequestOptions,
  CesiumIonTilesetMetadata,
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
  GLTFStyleBufferView,
  StructuralMetadataRow,
  Tile3DBatchTableLike,
  Tile3DStyleInput,
  Tile3DStyleInputOptions,
  Tile3DStylePropertySource,
  ImplicitTilingStats,
  ImplicitAvailability,
  ImplicitSubtreeReference,
  ImplicitTileHeader,
  ImplicitTilingDescriptor,
  MaterializedImplicitSubtree,
  ParsedImplicitSubtree,
  ImplicitTileCoordinates
} from './bundled';
