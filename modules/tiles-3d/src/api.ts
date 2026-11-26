// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {default as Tile3DFeatureTable} from './3d-tiles/lib/classes/tile-3d-feature-table';
export {default as Tile3DBatchTable} from './3d-tiles/lib/classes/tile-3d-batch-table';
export {TILE3D_TYPE} from './3d-tiles/lib/constants';
export {Tiles3DArchive} from './3d-tiles/3d-tiles-archive/3d-tiles-archive-archive';
export {parse3DTilesArchive} from './3d-tiles/3d-tiles-archive/3d-tiles-archive-parser';
export {
  getStructuralMetadataProperty,
  getStructuralMetadataRow
} from './3d-tiles/lib/metadata/property-table';
export {
  createTile3DStyleInput,
  getTile3DBatchTableProperties,
  getTile3DStyleProperty
} from './3d-tiles/lib/metadata/style-input';
export {
  createImplicitSubtreeReference,
  materializeImplicitSubtree,
  replaceImplicitUrlTemplate
} from './tileset-3d/format-3d-tiles/implicit-tiling';
export type {Tiles3DArchiveFileLoaderOptions} from './3d-tiles/3d-tiles-archive-loader';
export type {Tiles3DArchiveSourceInput} from './3d-tiles/3d-tiles-archive-source';
export type {Tiles3DLoaderOptions} from './3d-tiles/tiles-3d-loader';
export type {
  Tiles3DArchiveFiles,
  Tiles3DArchiveWriterOptions
} from './3d-tiles/3d-tiles-archive-writer';
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
} from './3d-tiles/types';
export type {StructuralMetadataRow} from './3d-tiles/lib/metadata/property-table';
export type {
  Tile3DBatchTableLike,
  Tile3DStyleInput,
  Tile3DStyleInputOptions,
  Tile3DStylePropertySource
} from './3d-tiles/lib/metadata/style-input';
export type {ImplicitTilingStats} from './tileset-3d/format-3d-tiles/tiles-3d-source';
export type {
  ImplicitAvailability,
  ImplicitSubtreeReference,
  ImplicitTileHeader,
  ImplicitTilingDescriptor,
  MaterializedImplicitSubtree,
  ParsedImplicitSubtree,
  ImplicitTileCoordinates
} from './tileset-3d/format-3d-tiles/implicit-tiling';
export {I3S_CONFORMANCE_PROFILES} from './i3s/i3s-conformance';
export {loadFeatureAttributes} from './i3s/i3s-attribute-loader-with-parser';
export {I3SLEPCCDecoder} from './i3s/i3s-lepcc';
export {
  createI3SLayerSource,
  I3SUnsupportedProfileError,
  normalizeI3SServiceMetadata,
  normalizeI3SRendererMetadata,
  getI3SFeatureSupportReport,
  parseI3SSceneLayerMetadata
} from './i3s/i3s-service';
export {COORDINATE_SYSTEM} from './i3s/lib/parsers/constants';
export {SLPKArchive} from './i3s/lib/parsers/parse-slpk/slpk-archieve';
export {parseSLPKArchive} from './i3s/lib/parsers/parse-slpk/parse-slpk';
export {LayerError} from './i3s/lib/parsers/parse-arcgis-webscene';
export {customizeColors} from './i3s/lib/utils/customize-colors';
export {loadStatistics} from './i3s/i3s-statistics';
export type {I3SLoaderOptions} from './i3s/i3s-loader';
export type {I3SConformanceProfile} from './i3s/i3s-conformance';
export type {SLPKSourceInput} from './i3s/i3s-slpk-source';
export type {I3SLEPCCLoaderOptions, I3SLEPCCLoaderResult} from './i3s/i3s-lepcc-loader-types';
export type {I3SLEPCCBlobType, I3SLEPCCDecodedValue, I3SLEPCCDecoderOptions} from './i3s/i3s-lepcc';
export type {
  I3SLayerSource,
  I3SServiceMetadata,
  I3SFeatureSupportStatus,
  I3SSupportDiagnostic,
  I3SRendererMetadata,
  I3SFeatureSupportReport
} from './i3s/i3s-service';
export type {I3SPointCloudSourceOptions} from './i3s/i3s-point-cloud-source';
export type {
  BoundingVolumes,
  Mbs,
  Obb,
  I3STilesetHeader,
  I3STileContent,
  I3STileHeader,
  SceneLayer3D,
  AttributeStorageInfo,
  Field,
  ESRIField,
  PopupInfo,
  Node3DIndexDocument,
  LodSelection,
  NodeReference,
  Resource,
  MaxScreenThresholdSQ,
  NodePage,
  NodeInPage,
  SharedResources,
  Attribute,
  Extent,
  FeatureAttribute,
  FieldInfo,
  I3SMaterialDefinition,
  I3SDrawRange,
  I3SRenderer,
  I3SPointRenderer,
  I3SPointSymbol,
  I3SPointSymbolLayer,
  TextureDefinitionInfo,
  MaterialDefinitionInfo,
  FullExtent,
  StatisticsInfo,
  StatsInfo,
  Histogram,
  ValueCount,
  BuildingSceneSublayer,
  OperationalLayer,
  TextureSetDefinitionFormats,
  I3SPointCloudAttributeInfo,
  I3SPointCloudNode,
  I3SPointCloudNodePage,
  PointCloudDefaultGeometrySchema,
  Store
} from './i3s/types';
export type {SLPKWriterFiles, SLPKWriterOptions} from './i3s/i3s-slpk-writer';
export type {I3STileAttributes} from './i3s/lib/parsers/parse-i3s-attribute';
export type {I3SStatistics} from './i3s/i3s-statistics';
export type {
  I3SMeshWriterOptions,
  I3SDracoLibraryOptions,
  EncodedI3SMeshLayer,
  I3SMeshMaterial
} from './i3s/i3s-mesh-writer';
export type {I3SMeshFeatures} from './i3s/i3s-mesh-attributes';
export type {I3SMeshTexture} from './i3s/i3s-mesh-texture';
export {PointCloudTileset} from './point-cloud/point-cloud-tileset';
export {PointCloudTile} from './point-cloud/point-cloud-tile';
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
export type {
  PointCloudTileSourceInput,
  PointCloudTileLoaderOptions
} from './point-cloud-tile-source-types';
