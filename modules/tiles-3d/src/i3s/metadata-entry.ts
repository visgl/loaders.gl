// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {I3SLoader} from './i3s-loader';
export {SLPKLoader} from './i3s-slpk-loader';
export {I3SContentLoader} from './i3s-content-loader';
export {I3SLEPCCLoader} from './i3s-lepcc-loader-types';
export {I3SAttributeLoader} from './i3s-attribute-loader';
export {I3SBuildingSceneLayerLoader} from './i3s-building-scene-layer-loader';
export {I3SNodePageLoader} from './i3s-node-page-loader';
export {ArcGISWebSceneLoader} from './arcgis-webscene-loader';
export {ArcGISWebSceneFormat} from './i3s-format';
export {I3SAttributeFormat} from './i3s-format';
export {I3SBuildingSceneLayerFormat} from './i3s-format';
export {I3SContentFormat} from './i3s-format';
export {I3SLEPCCFormat} from './i3s-format';
export {I3SFormat} from './i3s-format';
export {I3SNodePageFormat} from './i3s-format';
export {SLPKFormat} from './i3s-format';
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
} from './types';
export type {I3SLoaderOptions} from './i3s-loader';
export type {I3S_CONFORMANCE_PROFILES, I3SConformanceProfile} from './i3s-conformance';
export type {
  I3SPointCloudNodePageSchema,
  I3SPointCloudNodeSchema,
  I3SPointCloudSceneLayerSchema,
  I3SPointSceneLayerSchema,
  I3SPointCloudStoreSchema
} from './i3s-zod-schema';
export type {COORDINATE_SYSTEM} from './lib/parsers/constants';
export type {SLPKWriterFiles, SLPKWriterOptions} from './i3s-slpk-writer';
export type {SLPKSourceInput, SLPKSource} from './i3s-slpk-source';
export type {I3SLEPCCLoaderOptions, I3SLEPCCLoaderResult} from './i3s-lepcc-loader-types';
export type {loadFeatureAttributes} from './i3s-attribute-loader';
export type {SLPKArchive} from './lib/parsers/parse-slpk/slpk-archieve';
export type {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';
export type {LayerError} from './lib/parsers/parse-arcgis-webscene';
export type {customizeColors} from './lib/utils/customize-colors';
export type {I3STileAttributes} from './lib/parsers/parse-i3s-attribute';
export type {loadStatistics, I3SStatistics} from './i3s-statistics';
export type {
  I3SLEPCCDecoder,
  I3SLEPCCBlobType,
  I3SLEPCCDecodedValue,
  I3SLEPCCDecoderOptions
} from './i3s-lepcc';
export type {I3SPointCloudSource, I3SPointCloudSourceOptions} from './i3s-point-cloud-source';
export type {
  createI3SLayerSource,
  I3SUnsupportedProfileError,
  normalizeI3SServiceMetadata,
  normalizeI3SRendererMetadata,
  getI3SFeatureSupportReport,
  parseI3SSceneLayerMetadata,
  I3SLayerSource,
  I3SServiceMetadata,
  I3SFeatureSupportStatus,
  I3SSupportDiagnostic,
  I3SRendererMetadata,
  I3SFeatureSupportReport
} from './i3s-service';
export type {
  encodeI3SMeshLayer,
  encodeI3SMeshLayerWithDraco,
  preloadI3SMeshCompression,
  I3SMeshWriterOptions,
  I3SDracoLibraryOptions,
  EncodedI3SMeshLayer,
  I3SMeshMaterial
} from './i3s-mesh-writer';
export type {I3SMeshFeatures} from './i3s-mesh-attributes';
export type {I3SMeshTexture} from './i3s-mesh-texture';
export type {I3SSource} from '../tileset-3d/format-i3s/i3s-source';
export {SLPKWriter} from './i3s-slpk-writer-types';
