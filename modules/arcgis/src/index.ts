// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader-types';
export type {
  ArcGISFeatureServiceQueryOptions,
  ArcGISFeatureServerSourceLoaderOptions
} from './arcgis/arcgis-feature-server-source-options';
export {ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader-types';
export type {
  ArcGISImageSourceLoaderProps,
  ArcGISExportImageParameters
} from './arcgis/arcgis-image-server-source-options';
export {ArcGISImageTileSourceLoader} from './arcgis/arcgis-image-tile-source-loader-types';
export type {ArcGISImageTileSourceLoaderOptions} from './arcgis/arcgis-image-tile-source-options';
export {ArcGISMapTileSourceLoader} from './arcgis/arcgis-map-tile-source-loader-types';
export type {
  ArcGISMapTileSourceLoaderOptions,
  ArcGISMapServerMetadata,
  ArcGISMapTileParameters
} from './arcgis/arcgis-map-tile-source-options';
export {ArcGISSceneServerSourceLoader} from './arcgis/arcgis-scene-server-source-loader-types';
export type {
  ArcGISSceneQueryOptions,
  ArcGISSceneQueryResult,
  ArcGISSceneServerSourceOptions
} from './arcgis/arcgis-scene-server-source-options';
export {ArcGISVectorTileServerSourceLoader} from './arcgis/arcgis-vector-tile-server-source-loader-types';
export type {
  ArcGISVectorTileServiceMetadata,
  ArcGISVectorTileServerSourceLoaderOptions
} from './arcgis/arcgis-vector-tile-server-source-options';

export {ARCGIS_LOADERS, getArcGISLoader} from './service-registry';
export type {ArcGISLoader} from './service-registry';
