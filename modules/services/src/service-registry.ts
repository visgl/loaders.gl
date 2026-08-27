// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader';
import {ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader';
import {ArcGISImageTileSourceLoader} from './arcgis/arcgis-image-tile-source-loader';
import {ArcGISMapTileSourceLoader} from './arcgis/arcgis-map-tile-source-loader';
import {ArcGISVectorTileServerSourceLoader} from './arcgis/arcgis-vector-tile-server-source-loader';
import type {CoreAPI, DataSource, DataSourceOptions} from '@loaders.gl/loader-utils';

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

/**
 * Creates a service source from an explicit capability type or URL detection.
 *
 * The optional type should come from normalized service capabilities. When it is
 * omitted, the small registry tests each known service loader in declaration order.
 * A CoreAPI is required because image and tile sources decode responses through
 * the application's configured loaders.gl core integration.
 */
export function createServiceSource(
  url: string,
  options: DataSourceOptions = {},
  serviceType: string | undefined,
  coreApi: CoreAPI
): DataSource<unknown, DataSourceOptions> {
  const serviceLoader = serviceType
    ? getServiceLoader(serviceType)
    : SERVICE_LOADERS.find(loader => loader.testURL(url));
  if (!serviceLoader) {
    throw new Error(`No service loader recognized type or URL: ${serviceType || url}`);
  }
  return serviceLoader.createDataSource(url, options, coreApi);
}
