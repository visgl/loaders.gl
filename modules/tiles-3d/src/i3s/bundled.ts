// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

export type {I3SLoaderOptions} from './i3s-loader';
export {I3S_CONFORMANCE_PROFILES} from './i3s-conformance';
export type {I3SConformanceProfile} from './i3s-conformance';
export {
  I3SPointCloudNodePageSchema,
  I3SPointCloudNodeSchema,
  I3SPointCloudSceneLayerSchema,
  I3SPointCloudStoreSchema
} from './i3s-zod-schema';
export {I3SLoaderWithParser as I3SLoader} from './i3s-loader-with-parser';
export {SLPKLoaderWithParser as SLPKLoader} from './i3s-slpk-loader-with-parser';
export type {SLPKSourceInput} from './i3s-slpk-source';
export {SLPKSource} from './i3s-slpk-source';
export {I3SContentLoaderWithParser as I3SContentLoader} from './i3s-content-loader-with-parser';
export {I3SLEPCCLoaderWithParser as I3SLEPCCLoader} from './i3s-lepcc-loader';
export type {I3SLEPCCLoaderOptions, I3SLEPCCLoaderResult} from './i3s-lepcc-loader-types';
export {
  I3SAttributeLoaderWithParser as I3SAttributeLoader,
  loadFeatureAttributes
} from './i3s-attribute-loader-with-parser';
export {I3SBuildingSceneLayerLoaderWithParser as I3SBuildingSceneLayerLoader} from './i3s-building-scene-layer-loader-with-parser';
export {I3SNodePageLoaderWithParser as I3SNodePageLoader} from './i3s-node-page-loader-with-parser';
export {ArcGISWebSceneLoaderWithParser as ArcGISWebSceneLoader} from './arcgis-webscene-loader-with-parser';
export {
  I3SLEPCCDecoder,
  type I3SLEPCCBlobType,
  type I3SLEPCCDecodedValue,
  type I3SLEPCCDecoderOptions
} from './i3s-lepcc';
export {I3SPointCloudSource} from './i3s-point-cloud-source';
export {
  createI3SLayerSource,
  I3SUnsupportedProfileError,
  normalizeI3SServiceMetadata,
  normalizeI3SRendererMetadata,
  getI3SFeatureSupportReport,
  parseI3SSceneLayerMetadata
} from './i3s-service';
export type {
  I3SLayerSource,
  I3SServiceMetadata,
  I3SFeatureSupportStatus,
  I3SSupportDiagnostic,
  I3SRendererMetadata,
  I3SFeatureSupportReport
} from './i3s-service';
export type {I3SPointCloudSourceOptions} from './i3s-point-cloud-source';
export {
  type BoundingVolumes,
  type Mbs,
  type Obb,
  type I3STilesetHeader,
  type I3STileContent,
  type I3STileHeader,
  type SceneLayer3D,
  type AttributeStorageInfo,
  type Field,
  type ESRIField,
  type PopupInfo,
  type Node3DIndexDocument,
  type LodSelection,
  type NodeReference,
  type Resource,
  type MaxScreenThresholdSQ,
  type NodePage,
  type NodeInPage,
  type SharedResources,
  type Attribute,
  type Extent,
  type FeatureAttribute,
  type FieldInfo,
  type I3SMaterialDefinition,
  type I3SDrawRange,
  type I3SRenderer,
  type I3SPointRenderer,
  type I3SPointSymbol,
  type I3SPointSymbolLayer,
  type TextureDefinitionInfo,
  type MaterialDefinitionInfo,
  type FullExtent,
  type StatisticsInfo,
  type StatsInfo,
  type Histogram,
  type ValueCount,
  type BuildingSceneSublayer,
  type OperationalLayer,
  type TextureSetDefinitionFormats,
  type I3SPointCloudAttributeInfo,
  type I3SPointCloudNode,
  type I3SPointCloudNodePage,
  type PointCloudDefaultGeometrySchema,
  type Store,
  I3SPointSceneLayerSchema,
  COORDINATE_SYSTEM,
  ArcGISWebSceneFormat,
  I3SAttributeFormat,
  I3SBuildingSceneLayerFormat,
  I3SContentFormat,
  I3SLEPCCFormat,
  I3SFormat,
  I3SNodePageFormat,
  SLPKFormat,
  SLPKWriter,
  type SLPKWriterFiles,
  type SLPKWriterOptions,
  SLPKArchive,
  parseSLPKArchive,
  LayerError,
  customizeColors,
  type I3STileAttributes,
  loadStatistics,
  type I3SStatistics,
  encodeI3SMeshLayer,
  encodeI3SMeshLayerWithDraco,
  preloadI3SMeshCompression,
  type I3SMeshWriterOptions,
  type I3SDracoLibraryOptions,
  type EncodedI3SMeshLayer,
  type I3SMeshFeatures,
  type I3SMeshMaterial,
  type I3SMeshTexture,
  I3SSource
} from './index';
