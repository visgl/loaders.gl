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

export {ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader-types';
export type {ArcGISVectorSource} from './arcgis/arcgis-feature-server-source-loader';
export {ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader-types';
export type {ArcGISImageSource} from './arcgis/arcgis-image-server-source-loader';
export {ArcGISImageTileSourceLoader} from './arcgis/arcgis-image-tile-source-loader-types';
export type {ArcGISImageTileSource} from './arcgis/arcgis-image-tile-source-loader';
export {ArcGISMapTileSourceLoader} from './arcgis/arcgis-map-tile-source-loader-types';
export type {ArcGISMapTileSource} from './arcgis/arcgis-map-tile-source-loader';
export {ArcGISSceneServerSourceLoader} from './arcgis/arcgis-scene-server-source-loader-types';
export type {
  ArcGISSceneServerSource,
  ArcGISSceneServerQueryError
} from './arcgis/arcgis-scene-server-source-loader';
export {ArcGISVectorTileServerSourceLoader} from './arcgis/arcgis-vector-tile-server-source-loader-types';
export type {ArcGISVectorTileServerSource} from './arcgis/arcgis-vector-tile-server-source-loader';
export type {
  ArcGISFeatureServiceQueryOptions,
  ArcGISFeatureServerSourceLoaderOptions,
  ArcGISExportImageParameters,
  ArcGISImageSourceLoaderProps,
  ArcGISImageTileSourceLoaderOptions,
  ArcGISMapTileSourceLoaderOptions,
  ArcGISVectorTileServiceMetadata,
  ArcGISVectorTileServerSourceLoaderOptions,
  ArcGISSceneServerSourceOptions,
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
