// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader-types';
import {ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader-types';
import {ArcGISImageTileSourceLoader} from './arcgis/arcgis-image-tile-source-loader-types';
import {ArcGISMapTileSourceLoader} from './arcgis/arcgis-map-tile-source-loader-types';
import {ArcGISSceneServerSourceLoader} from './arcgis/arcgis-scene-server-source-loader-types';
import {ArcGISVectorTileServerSourceLoader} from './arcgis/arcgis-vector-tile-server-source-loader-types';

/** A source loader currently exposed through the ArcGIS package. */
export type ArcGISLoader =
  | typeof ArcGISFeatureServerSourceLoader
  | typeof ArcGISImageServerSourceLoader
  | typeof ArcGISImageTileSourceLoader
  | typeof ArcGISMapTileSourceLoader
  | typeof ArcGISVectorTileServerSourceLoader
  | typeof ArcGISSceneServerSourceLoader;

/** All source loaders owned by `@loaders.gl/arcgis`, in URL-selection order. */
export const ARCGIS_LOADERS: ArcGISLoader[] = [
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  ArcGISVectorTileServerSourceLoader,
  ArcGISSceneServerSourceLoader
];

/**
 * Finds a service loader by its canonical loader id or service type.
 *
 * The lookup is intentionally small and explicit. It provides discovery without
 * introducing a second request lifecycle or hiding provider-specific options.
 */
export function getArcGISLoader(serviceType: string): ArcGISLoader | undefined {
  const normalizedServiceType = serviceType.toLowerCase();
  return ARCGIS_LOADERS.find(
    serviceLoader =>
      serviceLoader.id === normalizedServiceType || serviceLoader.type === normalizedServiceType
  );
}
