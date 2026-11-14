// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISFeatureServerLoaderWithParser as ArcGISFeatureServerLoader} from './arcgis/arcgis-feature-server-loader';
export {
  ArcGISFeatureServerLoaderWithParser as ArcGISFeatureServerLoader,
  ArcGISVectorSource,
  ArcGISFeatureQueryError
} from './arcgis/arcgis-feature-server-loader';
import {ArcGISImageServerLoaderWithParser as ArcGISImageServerLoader} from './arcgis/arcgis-image-server-loader';
export {
  ArcGISImageServerLoaderWithParser as ArcGISImageServerLoader,
  ArcGISImageSource
} from './arcgis/arcgis-image-server-loader';
import {ArcGISImageTileLoaderWithParser as ArcGISImageTileLoader} from './arcgis/arcgis-image-tile-loader';
export {
  ArcGISImageTileLoaderWithParser as ArcGISImageTileLoader,
  ArcGISImageTileSource
} from './arcgis/arcgis-image-tile-loader';
import {ArcGISMapTileLoaderWithParser as ArcGISMapTileLoader} from './arcgis/arcgis-map-tile-loader';
export {
  ArcGISMapTileLoaderWithParser as ArcGISMapTileLoader,
  ArcGISMapTileSource
} from './arcgis/arcgis-map-tile-loader';
import {ArcGISSceneServerLoaderWithParser as ArcGISSceneServerLoader} from './arcgis/arcgis-scene-server-loader';
export {
  ArcGISSceneServerLoaderWithParser as ArcGISSceneServerLoader,
  ArcGISSceneServerSource,
  ArcGISSceneServerQueryError
} from './arcgis/arcgis-scene-server-loader';
import {ArcGISVectorTileServerLoaderWithParser as ArcGISVectorTileServerLoader} from './arcgis/arcgis-vector-tile-server-loader';
export {
  ArcGISVectorTileServerLoaderWithParser as ArcGISVectorTileServerLoader,
  ArcGISVectorTileServerSource
} from './arcgis/arcgis-vector-tile-server-loader';

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
  ArcGISItemOptions
} from './index';
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

export {resolveArcGISItem} from './arcgis-items';
