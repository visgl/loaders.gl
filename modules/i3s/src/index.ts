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
  NodeInPage,
  SharedResources,
  Attribute,
  Extent,
  FeatureAttribute,
  FieldInfo,
  I3SMaterialDefinition,
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
export type {I3SLoaderOptions} from './i3s-loader';

export {COORDINATE_SYSTEM} from './lib/parsers/constants';

export {I3SLoader} from './i3s-loader';
export {SLPKLoader} from './i3s-slpk-loader';
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
