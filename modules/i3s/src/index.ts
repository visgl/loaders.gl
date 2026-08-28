// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  TextureSetDefinitionFormats
} from './types';
export type {
  I3SPointCloudAttributeInfo,
  I3SPointCloudNode,
  I3SPointCloudNodePage,
  PointCloudDefaultGeometrySchema,
  Store
} from './types';
export type {I3SLoaderOptions} from './i3s-loader';
export {
  I3SPointCloudNodePageSchema,
  I3SPointCloudNodeSchema,
  I3SPointCloudSceneLayerSchema,
  I3SPointSceneLayerSchema,
  I3SPointCloudStoreSchema
} from './i3s-zod-schema';

export {COORDINATE_SYSTEM} from './lib/parsers/constants';
export {
  ArcGISWebSceneFormat,
  I3SAttributeFormat,
  I3SBuildingSceneLayerFormat,
  I3SContentFormat,
  I3SFormat,
  I3SNodePageFormat,
  SLPKFormat
} from './i3s-format';

export {I3SLoader} from './i3s-loader';
export {SLPKLoader} from './i3s-slpk-loader';
export type {SLPKSourceInput} from './i3s-slpk-source';
export {SLPKSource} from './i3s-slpk-source';
export {I3SContentLoader} from './i3s-content-loader';
export {I3SAttributeLoader, loadFeatureAttributes} from './i3s-attribute-loader';
export {I3SBuildingSceneLayerLoader} from './i3s-building-scene-layer-loader';
export {I3SNodePageLoader} from './i3s-node-page-loader';
export {ArcGISWebSceneLoader} from './arcgis-webscene-loader';

export {SLPKArchive} from './lib/parsers/parse-slpk/slpk-archieve';
export {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';
export {LayerError} from './lib/parsers/parse-arcgis-webscene';
export {customizeColors} from './lib/utils/customize-colors';
export {type I3STileAttributes} from './lib/parsers/parse-i3s-attribute';
export {loadStatistics} from './i3s-statistics';
export type {I3SStatistics} from './i3s-statistics';
export {
  I3SLEPCCDecoder,
  type I3SLEPCCBlobType,
  type I3SLEPCCDecodedValue,
  type I3SLEPCCDecoderOptions
} from './i3s-lepcc';
export {I3SPointCloudSource} from './i3s-point-cloud-source';
export type {I3SPointCloudSourceOptions} from './i3s-point-cloud-source';
export {
  createI3SLayerSource,
  I3SUnsupportedProfileError,
  normalizeI3SServiceMetadata,
  parseI3SSceneLayerMetadata
} from './i3s-service';
export type {I3SLayerSource, I3SServiceMetadata} from './i3s-service';
