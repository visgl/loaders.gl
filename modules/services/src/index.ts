// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Returns services discovered from an ArcGIS REST services directory.
 */
export {getArcGISServices} from '@loaders.gl/wms';
export type {Service as ArcGISService} from '@loaders.gl/wms';

/** ArcGIS FeatureServer source and loader. */
export {
  ArcGISFeatureServerSourceLoader,
  ArcGISVectorSource
} from '@loaders.gl/wms';
export type {
  ArcGISFeatureServiceQueryOptions,
  ArcGISFeatureServerSourceLoaderOptions
} from '@loaders.gl/wms';

/** ArcGIS ImageServer source and loader. */
export {
  ArcGISImageServerSourceLoader,
  ArcGISImageSource
} from '@loaders.gl/wms';
export type {
  ArcGISExportImageParameters,
  ArcGISImageSourceLoaderProps
} from '@loaders.gl/wms';

/** ArcGIS cached MapServer tile source and loader. */
export {ArcGISMapTileSourceLoader, ArcGISMapTileSource} from '@loaders.gl/wms';
export type {ArcGISMapTileSourceLoaderOptions} from '@loaders.gl/wms';

/** ArcGIS ImageServer export tile source and loader. */
export {ArcGISImageTileSourceLoader, ArcGISImageTileSource} from '@loaders.gl/wms';
export type {ArcGISImageTileSourceLoaderOptions} from '@loaders.gl/wms';

/** ArcGIS vector tile service source and loader. */
export {
  ArcGISVectorTileServerSourceLoader,
  ArcGISVectorTileServerSource
} from '@loaders.gl/wms';
export type {ArcGISVectorTileServerSourceLoaderOptions} from '@loaders.gl/wms';

export type {ServiceLoader} from './service-registry';
export {getServiceLoader} from './service-registry';
