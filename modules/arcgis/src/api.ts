// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {getArcGISLoader} from './arcgis-loader-registry';
export {ArcGISFeatureQueryError} from './arcgis/arcgis-feature-query';
export {ArcGISSceneServerQueryError} from './arcgis/arcgis-scene-server-loader';
export {getArcGISServices} from './arcgis/arcgis-server';
export {discoverArcGISCapabilities, selectArcGISService} from './arcgis/arcgis-capability-graph';
export {aggregateArcGISSceneFeatures} from './arcgis/arcgis-scene-aggregation';
export {ArcGISAuthentication, createArcGISCredential} from './authentication';
export {resolveArcGISItem} from './arcgis-items';
export type {Service as ArcGISService} from './arcgis/arcgis-server';
export type {
  ArcGISCapabilityGraph,
  ArcGISCapabilityGraphOptions,
  ArcGISServiceCapabilities,
  ArcGISServiceSelection
} from './arcgis/arcgis-capability-graph';
export type {
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
  ArcGISSceneQueryResult
} from './arcgis-source-types';
export type {
  ArcGISSceneAggregationOperation,
  ArcGISSceneAggregationSpec,
  ArcGISSceneAggregationOptions,
  ArcGISSceneAggregationGroup
} from './arcgis/arcgis-scene-aggregation';
export type {ArcGISCredentialOptions} from './authentication';
export type {
  ArcGISFeatureQueryParameters,
  ArcGISFeatureQueryOptions,
  ArcGISFeatureQueryProgress,
  ArcGISFeatureQueryResult,
  ArcGISFeatureObjectIds,
  ArcGISFeatureExtent
} from './arcgis-feature-query-types';
export type {
  ArcGISItem,
  ArcGISItemLayer,
  ArcGISItemResolution,
  ArcGISItemOptions
} from './arcgis-items';
export type {ArcGISLoader} from './arcgis-loader-registry';
