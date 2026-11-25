// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {I3S_CONFORMANCE_PROFILES} from './i3s-conformance';
export {
  I3SPointCloudNodePageSchema,
  I3SPointCloudNodeSchema,
  I3SPointCloudSceneLayerSchema,
  I3SPointCloudStoreSchema,
  I3SPointSceneLayerSchema
} from './i3s-zod-schema';
export {loadFeatureAttributes} from './i3s-attribute-loader-with-parser';
export {I3SLEPCCDecoder} from './i3s-lepcc';
export {
  createI3SLayerSource,
  I3SUnsupportedProfileError,
  normalizeI3SServiceMetadata,
  normalizeI3SRendererMetadata,
  getI3SFeatureSupportReport,
  parseI3SSceneLayerMetadata
} from './i3s-service';
export {COORDINATE_SYSTEM} from './lib/parsers/constants';
export {SLPKArchive} from './lib/parsers/parse-slpk/slpk-archieve';
export {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';
export {LayerError} from './lib/parsers/parse-arcgis-webscene';
export {customizeColors} from './lib/utils/customize-colors';
export {loadStatistics} from './i3s-statistics';
export {
  encodeI3SMeshLayer,
  encodeI3SMeshLayerWithDraco,
  preloadI3SMeshCompression
} from './i3s-mesh-writer';
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
} from './bundled';
