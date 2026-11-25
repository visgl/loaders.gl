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
export {ARCGIS_LOADERS} from './bundled';
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
