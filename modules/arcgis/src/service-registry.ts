// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerLoader} from './arcgis/arcgis-feature-server-loader-types';
import {ArcGISImageServerLoader} from './arcgis/arcgis-image-server-loader-types';
import {ArcGISImageTileLoader} from './arcgis/arcgis-image-tile-loader-types';
import {ArcGISMapTileLoader} from './arcgis/arcgis-map-tile-loader-types';
import {ArcGISSceneServerLoader} from './arcgis/arcgis-scene-server-loader-types';
import {ArcGISVectorTileServerLoader} from './arcgis/arcgis-vector-tile-server-loader-types';

/** A source loader currently exposed through the ArcGIS package. */
export type ArcGISLoader =
  | typeof ArcGISFeatureServerLoader
  | typeof ArcGISImageServerLoader
  | typeof ArcGISImageTileLoader
  | typeof ArcGISMapTileLoader
  | typeof ArcGISVectorTileServerLoader
  | typeof ArcGISSceneServerLoader;

/** All source loaders owned by `@loaders.gl/arcgis`, in URL-selection order. */
export const ARCGIS_LOADERS: ArcGISLoader[] = [
  ArcGISFeatureServerLoader,
  ArcGISImageServerLoader,
  ArcGISImageTileLoader,
  ArcGISMapTileLoader,
  ArcGISVectorTileServerLoader,
  ArcGISSceneServerLoader
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
