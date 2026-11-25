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
export type {
  GeoTIFFLoaderOptions,
  GeoTIFFSourceLoaderOptions,
  GetOMETiffParameters,
  OMETiffChannelMetadata,
  OMETiffLevelMetadata,
  OMETiffSourceLoaderMetadata,
  OMETiffLoaderOptions,
  GeoTIFFRasterData,
  GeoTIFFRasterImage,
  GeoTIFFRasterBand,
  GeoTIFFRasterLoaderOptions,
  DiscoverGeoTIFFOptions
} from './bundled';
