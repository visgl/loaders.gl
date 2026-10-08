// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerSourceLoaderWithParser as ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader';
export {
  ArcGISFeatureServerSourceLoaderWithParser as ArcGISFeatureServerSourceLoader,
  ArcGISVectorSource,
  ArcGISFeatureQueryError
} from './arcgis/arcgis-feature-server-source-loader';
import {ArcGISImageServerSourceLoaderWithParser as ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader';
export {
  ArcGISImageServerSourceLoaderWithParser as ArcGISImageServerSourceLoader,
  ArcGISImageSource
} from './arcgis/arcgis-image-server-source-loader';
import {ArcGISImageTileSourceLoaderWithParser as ArcGISImageTileSourceLoader} from './arcgis/arcgis-image-tile-source-loader';
export {
  ArcGISImageTileSourceLoaderWithParser as ArcGISImageTileSourceLoader,
  ArcGISImageTileSource
} from './arcgis/arcgis-image-tile-source-loader';
import {ArcGISMapTileSourceLoaderWithParser as ArcGISMapTileSourceLoader} from './arcgis/arcgis-map-tile-source-loader';
export {
  ArcGISMapTileSourceLoaderWithParser as ArcGISMapTileSourceLoader,
  ArcGISMapTileSource
} from './arcgis/arcgis-map-tile-source-loader';
import {ArcGISSceneServerSourceLoaderWithParser as ArcGISSceneServerSourceLoader} from './arcgis/arcgis-scene-server-source-loader';
export {
  ArcGISSceneServerSourceLoaderWithParser as ArcGISSceneServerSourceLoader,
  ArcGISSceneServerSource,
  ArcGISSceneServerQueryError
} from './arcgis/arcgis-scene-server-source-loader';
import {ArcGISVectorTileServerSourceLoaderWithParser as ArcGISVectorTileServerSourceLoader} from './arcgis/arcgis-vector-tile-server-source-loader';
export {
  ArcGISVectorTileServerSourceLoaderWithParser as ArcGISVectorTileServerSourceLoader,
  ArcGISVectorTileServerSource
} from './arcgis/arcgis-vector-tile-server-source-loader';

export type * from './index';
export {
  getArcGISServices,
  discoverArcGISCapabilities,
  selectArcGISService
} from './arcgis/arcgis-capability-graph';
export {aggregateArcGISSceneFeatures} from './arcgis/arcgis-scene-aggregation';
export {ArcGISAuthentication, createArcGISCredential} from './authentication';

/** A synchronous ArcGIS source loader, including its runtime implementation. */
export type ArcGISLoader = (typeof ARCGIS_LOADERS)[number];

/** All runtime ArcGIS loaders, in the same selection order as the package root. */
export const ARCGIS_LOADERS = [
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  ArcGISVectorTileServerSourceLoader,
  ArcGISSceneServerSourceLoader
];

/** Finds a runtime source loader by its canonical identifier or service type. */
export function getArcGISLoader(serviceType: string): ArcGISLoader | undefined {
  const normalizedServiceType = serviceType.toLowerCase();
  return ARCGIS_LOADERS.find(
    loader => loader.id === normalizedServiceType || loader.type === normalizedServiceType
  );
}

export {resolveArcGISItem} from './arcgis-items';
