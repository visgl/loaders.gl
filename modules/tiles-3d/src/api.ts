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
export type {
  Tiles3DArchiveFileLoaderOptions,
  Tiles3DArchiveSourceInput,
  Tiles3DLoaderOptions,
  Tiles3DArchiveFiles,
  Tiles3DArchiveWriterOptions,
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
} from './3d-tiles/bundled';
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
export type {
  I3SLoaderOptions,
  I3SConformanceProfile,
  SLPKSourceInput,
  I3SLEPCCLoaderOptions,
  I3SLEPCCLoaderResult,
  I3SLEPCCBlobType,
  I3SLEPCCDecodedValue,
  I3SLEPCCDecoderOptions,
  I3SLayerSource,
  I3SServiceMetadata,
  I3SFeatureSupportStatus,
  I3SSupportDiagnostic,
  I3SRendererMetadata,
  I3SFeatureSupportReport,
  I3SPointCloudSourceOptions,
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
  Store,
  SLPKWriterFiles,
  SLPKWriterOptions,
  I3STileAttributes,
  I3SStatistics,
  I3SMeshWriterOptions,
  I3SDracoLibraryOptions,
  EncodedI3SMeshLayer,
  I3SMeshFeatures,
  I3SMeshMaterial,
  I3SMeshTexture
} from './i3s/bundled';
export {PointCloudTileset} from './point-cloud/point-cloud-tileset';
export {PointCloudTile} from './point-cloud/point-cloud-tile';
export type {
  PointCloudAttribute,
  PointCloudBoundingVolume,
  PointCloudTileContent,
  PointCloudTileHeader,
  PointCloudTilesetSource,
  PointCloudTilesetViewState,
  PointCloudCoordinateSystem,
  PointCloudTilesetOptions,
  PointCloudTileSourceInput,
  PointCloudTileLoaderOptions
} from './point-cloud/bundled';
