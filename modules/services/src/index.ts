// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Returns services discovered from an ArcGIS REST services directory.
 */
export {getArcGISServices} from './arcgis/arcgis-server';
export type {Service as ArcGISService} from './arcgis/arcgis-server';
export {
  discoverArcGISCapabilities,
  selectArcGISService
} from './arcgis/arcgis-capability-graph';
export type {
  ArcGISCapabilityGraph,
  ArcGISCapabilityGraphOptions,
  ArcGISServiceCapabilities,
  ArcGISServiceSelection
} from './arcgis/arcgis-capability-graph';

/** ArcGIS FeatureServer source and loader. */
export {
  ArcGISFeatureServerSourceLoader,
  ArcGISVectorSource
} from './arcgis/arcgis-feature-server-source-loader';
export type {
  ArcGISFeatureServiceQueryOptions,
  ArcGISFeatureServerSourceLoaderOptions
} from './arcgis/arcgis-feature-server-source-loader';

/** ArcGIS ImageServer source and loader. */
export {
  ArcGISImageServerSourceLoader,
  ArcGISImageSource
} from './arcgis/arcgis-image-server-source-loader';
export type {
  ArcGISExportImageParameters,
  ArcGISImageSourceLoaderProps
} from './arcgis/arcgis-image-server-source-loader';

/** ArcGIS cached MapServer tile source and loader. */
export {
  ArcGISMapTileSourceLoader,
  ArcGISMapTileSource
} from './arcgis/arcgis-map-tile-source-loader';
export type {ArcGISMapTileSourceLoaderOptions} from './arcgis/arcgis-map-tile-source-loader';

/** ArcGIS ImageServer export tile source and loader. */
export {
  ArcGISImageTileSourceLoader,
  ArcGISImageTileSource
} from './arcgis/arcgis-image-tile-source-loader';
export type {ArcGISImageTileSourceLoaderOptions} from './arcgis/arcgis-image-tile-source-loader';

/** ArcGIS vector tile service source and loader. */
export {
  ArcGISVectorTileServerSourceLoader,
  ArcGISVectorTileServerSource
} from './arcgis/arcgis-vector-tile-server-source-loader';
export type {
  ArcGISVectorTileServiceMetadata,
  ArcGISVectorTileServerSourceLoaderOptions
} from './arcgis/arcgis-vector-tile-server-source-loader';

/** ArcGIS SceneServer I3S source and loader. */
export {
  ArcGISSceneServerSourceLoader,
  ArcGISSceneServerSource
} from './arcgis/arcgis-scene-server-source-loader';
export type {ArcGISSceneServerSourceOptions} from './arcgis/arcgis-scene-server-source-loader';

export type {ServiceLoader} from './service-registry';
export {SERVICE_LOADERS, getServiceLoader} from './service-registry';

export {
  createArcGISCredential,
  createCesiumIonCredential,
  createGoogleMapsCredential,
  createMapboxCredential
} from './authentication';
export type {
  ArcGISCredentialOptions,
  CesiumIonCredentialOptions,
  GoogleMapsCredentialOptions,
  MapboxCredentialOptions,
  ServiceCredentialOptions
} from './authentication';
