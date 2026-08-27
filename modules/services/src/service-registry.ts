// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader';
import {ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader';
import {ArcGISImageTileSourceLoader} from './arcgis/arcgis-image-tile-source-loader';
import {ArcGISMapTileSourceLoader} from './arcgis/arcgis-map-tile-source-loader';
import {ArcGISVectorTileServerSourceLoader} from './arcgis/arcgis-vector-tile-server-source-loader';

/** A source loader currently exposed through the services package. */
export type ServiceLoader =
  | typeof ArcGISFeatureServerSourceLoader
  | typeof ArcGISImageServerSourceLoader
  | typeof ArcGISImageTileSourceLoader
  | typeof ArcGISMapTileSourceLoader
  | typeof ArcGISVectorTileServerSourceLoader;

/** The initial service loader registry. */
const SERVICE_LOADERS: readonly ServiceLoader[] = [
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  ArcGISVectorTileServerSourceLoader
];

/**
 * Finds a service loader by its canonical loader id or service type.
 *
 * The lookup is intentionally small and explicit. It provides discovery without
 * introducing a second request lifecycle or hiding provider-specific options.
 */
export function getServiceLoader(serviceType: string): ServiceLoader | undefined {
  const normalizedServiceType = serviceType.toLowerCase();
  return SERVICE_LOADERS.find(
    serviceLoader =>
      serviceLoader.id === normalizedServiceType || serviceLoader.type === normalizedServiceType
  );
}
