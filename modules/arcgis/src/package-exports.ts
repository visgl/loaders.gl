// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {Service as ArcGISService} from './arcgis/arcgis-server';
export type {
  ArcGISCapabilityGraph,
  ArcGISCapabilityGraphOptions,
  ArcGISServiceCapabilities,
  ArcGISServiceSelection
} from './arcgis/arcgis-capability-graph';

export {ArcGISFeatureServerLoader} from './arcgis/arcgis-feature-server-loader-types';
export type {ArcGISVectorSource} from './arcgis/arcgis-feature-server-loader';
export {ArcGISImageServerLoader} from './arcgis/arcgis-image-server-loader-types';
export type {ArcGISImageSource} from './arcgis/arcgis-image-server-loader';
export {ArcGISImageTileLoader} from './arcgis/arcgis-image-tile-loader-types';
export type {ArcGISImageTileSource} from './arcgis/arcgis-image-tile-loader';
export {ArcGISMapTileLoader} from './arcgis/arcgis-map-tile-loader-types';
export type {ArcGISMapTileSource} from './arcgis/arcgis-map-tile-loader';
export {ArcGISSceneServerLoader} from './arcgis/arcgis-scene-server-loader-types';
export type {
  ArcGISSceneServerSource,
  ArcGISSceneServerQueryError
} from './arcgis/arcgis-scene-server-loader';
export {ArcGISVectorTileServerLoader} from './arcgis/arcgis-vector-tile-server-loader-types';
export type {ArcGISVectorTileServerSource} from './arcgis/arcgis-vector-tile-server-loader';
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

export type {ArcGISLoader} from './service-registry';
export {ARCGIS_LOADERS, getArcGISLoader} from './service-registry';

export type {ArcGISAuthentication} from './authentication';
export type {ArcGISCredentialOptions} from './authentication';

export type {
  ArcGISFeatureQueryParameters,
  ArcGISFeatureQueryOptions,
  ArcGISFeatureQueryProgress,
  ArcGISFeatureQueryResult,
  ArcGISFeatureObjectIds,
  ArcGISFeatureExtent
} from './arcgis-feature-query-types';
export type {ArcGISFeatureQueryError} from './arcgis/arcgis-feature-query';

export type {
  ArcGISItem,
  ArcGISItemLayer,
  ArcGISItemResolution,
  ArcGISItemOptions
} from './arcgis-items';
