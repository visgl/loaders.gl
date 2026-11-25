// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {getArcGISLoader} from './bundled';
export {ArcGISFeatureQueryError} from './arcgis/arcgis-feature-query';
export {ArcGISSceneServerQueryError} from './arcgis/arcgis-scene-server-loader';
export {getArcGISServices} from './arcgis/arcgis-server';
export {discoverArcGISCapabilities, selectArcGISService} from './arcgis/arcgis-capability-graph';
export {aggregateArcGISSceneFeatures} from './arcgis/arcgis-scene-aggregation';
export {ArcGISAuthentication, createArcGISCredential} from './authentication';
export {resolveArcGISItem} from './arcgis-items';
export type {
  ArcGISService,
  ArcGISCapabilityGraph,
  ArcGISCapabilityGraphOptions,
  ArcGISServiceCapabilities,
  ArcGISServiceSelection,
  ArcGISFeatureServiceQueryOptions,
  ArcGISFeatureServerLoaderOptions,
  ArcGISExportImageParameters,
  ArcGISImageServerLoaderOptions,
  ArcGISImageTileLoaderOptions,
  ArcGISMapTileLoaderOptions,
  ArcGISVectorTileServiceMetadata,
  ArcGISVectorTileServerLoaderOptions,
  ArcGISSceneServerLoaderOptions,
  ArcGISSceneQueryOptions,
  ArcGISSceneQueryResult,
  ArcGISSceneAggregationOperation,
  ArcGISSceneAggregationSpec,
  ArcGISSceneAggregationOptions,
  ArcGISSceneAggregationGroup,
  ArcGISCredentialOptions,
  ArcGISFeatureQueryParameters,
  ArcGISFeatureQueryOptions,
  ArcGISFeatureQueryProgress,
  ArcGISFeatureQueryResult,
  ArcGISFeatureObjectIds,
  ArcGISFeatureExtent,
  ArcGISItem,
  ArcGISItemLayer,
  ArcGISItemResolution,
  ArcGISItemOptions,
  ArcGISLoader
} from './bundled';
