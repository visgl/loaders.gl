// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerLoaderWithParser as ArcGISFeatureServerLoader} from './arcgis/arcgis-feature-server-loader';
import {ArcGISImageServerLoaderWithParser as ArcGISImageServerLoader} from './arcgis/arcgis-image-server-loader';
import {ArcGISImageTileLoaderWithParser as ArcGISImageTileLoader} from './arcgis/arcgis-image-tile-loader';
import {ArcGISMapTileLoaderWithParser as ArcGISMapTileLoader} from './arcgis/arcgis-map-tile-loader';
import {ArcGISSceneServerLoaderWithParser as ArcGISSceneServerLoader} from './arcgis/arcgis-scene-server-loader';
import {ArcGISVectorTileServerLoaderWithParser as ArcGISVectorTileServerLoader} from './arcgis/arcgis-vector-tile-server-loader';

/** A synchronous ArcGIS source loader, including its runtime implementation. */
export type ArcGISLoader = (typeof ARCGIS_LOADERS)[number];

/** All runtime ArcGIS loaders, in the same selection order as the package root. */
export const ARCGIS_LOADERS = [
  ArcGISFeatureServerLoader,
  ArcGISImageServerLoader,
  ArcGISImageTileLoader,
  ArcGISMapTileLoader,
  ArcGISVectorTileServerLoader,
  ArcGISSceneServerLoader
];

/** Finds a runtime source loader by its canonical identifier or service type. */
export function getArcGISLoader(serviceType: string): ArcGISLoader | undefined {
  const normalizedServiceType = serviceType.toLowerCase();
  return ARCGIS_LOADERS.find(
    loader => loader.id === normalizedServiceType || loader.type === normalizedServiceType
  );
}
