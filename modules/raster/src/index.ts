// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {GeoTIFFLoader} from './geotiff/geotiff-loader-types';
export type {GeoTIFFLoaderOptions} from './geotiff/geotiff-loader-types';
export {GeoTIFFRasterLoader} from './geotiff/geotiff-raster-loader-types';
export type {
  GeoTIFFRasterData,
  GeoTIFFRasterImage,
  GeoTIFFRasterBand,
  GeoTIFFRasterLoaderOptions
} from './geotiff/geotiff-raster-types';
export {GeoTIFFFormat, OMETiffFormat} from './geotiff/geotiff-format';
export {LERCLoader} from './lerc/lerc-loader-types';
export type {LERCLoaderOptions} from './lerc/lerc-loader-types';
export {LERCFormat} from './lerc/lerc-format';
export type {LERCData} from './lerc/lib/parsers/lerc/lerc-types';
export {TerrainLoader} from './terrain/terrain-loader-types';
/** @deprecated Use TerrainLoader. */
export {TerrainLoader as TerrainWorkerLoader} from './terrain/terrain-loader-types';
export type {TerrainLoaderOptions} from './terrain/terrain-loader-types';
export {QuantizedMeshLoader} from './terrain/quantized-mesh-loader-types';
/** @deprecated Use QuantizedMeshLoader. */
export {QuantizedMeshLoader as QuantizedMeshWorkerLoader} from './terrain/quantized-mesh-loader-types';
export type {QuantizedMeshLoaderOptions} from './terrain/quantized-mesh-loader-types';
export {TerrainFormat, QuantizedMeshFormat} from './terrain/terrain-format';
export {QuantizedMeshWriter} from './terrain/quantized-mesh-writer';
export type {QuantizedMeshWriterOptions} from './terrain/quantized-mesh-writer';
export type {
  ElevationDecoder,
  TerrainHeightmap,
  TerrainHeightmapImage
} from './terrain/lib/terrain-heightmap-types';
export type {
  TerrainGridMetadata,
  TerrainHeightGrid,
  TerrainRay,
  TerrainSurfaceHit,
  TerrainSurfaceBounds,
  TerrainSurface
} from './terrain/lib/terrain-contracts';
export {GeoTIFFSourceLoader} from './geotiff/geotiff-source-loader-types';
export {OMETiffSourceLoader} from './geotiff/ometiff-source-loader-types';
export type {GeoTIFFSourceLoaderOptions} from './geotiff/geotiff-source-loader';
export type {OMETiffSourceLoaderOptions} from './geotiff/ometiff-source-loader';
export type {
  TerrainFieldBounds,
  TerrainHeightFieldOptions,
  TerrainHeightFieldStatistics
} from './terrain/lib/terrain-height-field';
export type {
  GetOMETiffParameters,
  OMETiffChannelMetadata,
  OMETiffLevelMetadata,
  OMETiffSourceLoaderMetadata
} from './geotiff/ometiff-source-loader';
