// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {I3SLoaderWithParser as I3SLoader} from './i3s-loader-with-parser';
export {SLPKLoaderWithParser as SLPKLoader} from './i3s-slpk-loader-with-parser';
export {SLPKSource} from './i3s-slpk-source';
export {I3SContentLoaderWithParser as I3SContentLoader} from './i3s-content-loader-with-parser';
export {I3SLEPCCLoaderWithParser as I3SLEPCCLoader} from './i3s-lepcc-loader';
export {I3SAttributeLoaderWithParser as I3SAttributeLoader} from './i3s-attribute-loader-with-parser';
export {I3SBuildingSceneLayerLoaderWithParser as I3SBuildingSceneLayerLoader} from './i3s-building-scene-layer-loader-with-parser';
export {I3SNodePageLoaderWithParser as I3SNodePageLoader} from './i3s-node-page-loader-with-parser';
export {ArcGISWebSceneLoaderWithParser as ArcGISWebSceneLoader} from './arcgis-webscene-loader-with-parser';
export {I3SPointCloudSource} from './i3s-point-cloud-source';
export {
  ArcGISWebSceneFormat,
  I3SAttributeFormat,
  I3SBuildingSceneLayerFormat,
  I3SContentFormat,
  I3SLEPCCFormat,
  I3SFormat,
  I3SNodePageFormat,
  SLPKFormat
} from './i3s-format';
export {SLPKWriter, encodeSLPKArchiveInBatches} from './i3s-slpk-writer';
export {I3SSource} from '../tileset-3d/format-i3s/i3s-source';
export type {I3SLoaderOptions} from './i3s-loader';
export type {I3SConformanceProfile} from './i3s-conformance';
export type {SLPKSourceInput} from './i3s-slpk-source';
export type {I3SLEPCCLoaderOptions, I3SLEPCCLoaderResult} from './i3s-lepcc-loader-types';
export type {I3SLEPCCBlobType, I3SLEPCCDecodedValue, I3SLEPCCDecoderOptions} from './i3s-lepcc';
export type {
  I3SLayerSource,
  I3SServiceMetadata,
  I3SFeatureSupportStatus,
  I3SSupportDiagnostic,
  I3SRendererMetadata,
  I3SFeatureSupportReport
} from './i3s-service';
export type {I3SPointCloudSourceOptions} from './i3s-point-cloud-source';
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
export type {SLPKWriterFiles, SLPKWriterOptions} from './i3s-slpk-writer';
export type {I3STileAttributes} from './lib/parsers/parse-i3s-attribute';
export type {I3SStatistics} from './i3s-statistics';
export type {
  I3SMeshWriterOptions,
  I3SDracoLibraryOptions,
  EncodedI3SMeshLayer,
  I3SMeshMaterial
} from './i3s-mesh-writer';
export type {I3SMeshFeatures} from './i3s-mesh-attributes';
export type {I3SMeshTexture} from './i3s-mesh-texture';
