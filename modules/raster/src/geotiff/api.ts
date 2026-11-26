// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {loadGeoTiff} from './lib/load-geotiff';
export {discoverGeoTIFF, isTIFFHeader} from './discover-geotiff';
export {isTiff} from './geotiff-loader';
export {
  GEOTIFF_RASTER_QUERY_CAPABILITIES,
  createGeoTIFFSource,
  getImageTileGrid
} from './geotiff-source';
export type {GeoTIFFLoaderOptions} from './geotiff-loader-types';
export type {GeoTIFFSourceLoaderOptions} from './geotiff-source';
export type {
  GetOMETiffParameters,
  OMETiffChannelMetadata,
  OMETiffLevelMetadata,
  OMETiffSourceLoaderMetadata,
  OMETiffLoaderOptions
} from './ometiff-loader';
export type {
  GeoTIFFRasterData,
  GeoTIFFRasterImage,
  GeoTIFFRasterBand,
  GeoTIFFRasterLoaderOptions
} from './geotiff-raster-types';
export type {DiscoverGeoTIFFOptions} from './discover-geotiff';
