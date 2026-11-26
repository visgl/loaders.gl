// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  ArcGISFeatureServerLoaderWithParser as ArcGISFeatureServerLoader,
  ArcGISVectorSource
} from './arcgis/arcgis-feature-server-loader';
export {
  ArcGISImageServerLoaderWithParser as ArcGISImageServerLoader,
  ArcGISImageSource
} from './arcgis/arcgis-image-server-loader';
export {
  ArcGISImageTileLoaderWithParser as ArcGISImageTileLoader,
  ArcGISImageTileSource
} from './arcgis/arcgis-image-tile-loader';
export {
  ArcGISMapTileLoaderWithParser as ArcGISMapTileLoader,
  ArcGISMapTileSource
} from './arcgis/arcgis-map-tile-loader';
export {
  ArcGISSceneServerLoaderWithParser as ArcGISSceneServerLoader,
  ArcGISSceneServerSource
} from './arcgis/arcgis-scene-server-loader';
export {
  ArcGISVectorTileServerLoaderWithParser as ArcGISVectorTileServerLoader,
  ArcGISVectorTileServerSource
} from './arcgis/arcgis-vector-tile-server-loader';
export {ARCGIS_LOADERS} from './arcgis-loader-registry';
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
