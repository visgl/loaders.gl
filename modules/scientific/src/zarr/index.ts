// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {loadZarr} from './lib/load-zarr';
export {default as ZarrPixelSource} from './lib/zarr-pixel-source';
export {
  OMEZarrLoaderWithParser as OMEZarrLoader,
  OMEZarrImageSource,
  loadZarrConsolidatedMetadata
} from './ome-zarr-loader';
export {
  GeoZarrLoaderWithParser as GeoZarrLoader,
  GeoZarrRasterSource
} from './geo-zarr-loader';
export {
  ZarrArrayLoaderWithParser as ZarrArrayLoader,
  ZarrArraySource
} from './zarr-array-loader';
export {
  SpatialDataLoaderWithParser as SpatialDataLoader,
  SpatialDataSource
} from './spatial-data-loader';
export type {
  GetZarrArrayParameters,
  ZarrArrayData,
  ZarrArraySelection,
  ZarrArraySlice,
  ZarrArrayLoaderOptions,
  ZarrArraySourceMetadata
} from './zarr-array-loader';
export type {
  SpatialDataElementFormat,
  SpatialDataElementKind,
  SpatialDataElementMetadata,
  SpatialDataLoaderOptions,
  SpatialDataSourceMetadata,
  SpatialDataZarrElementSource
} from './spatial-data-loader';
export type {
  GetOMEZarrParameters,
  LoadConsolidatedMetadataOptions,
  LoadZarrConsolidatedMetadataOptions,
  OMEZarrChannelMetadata,
  OMEZarrLevelMetadata,
  OMEZarrSourceLoaderMetadata,
  ZarrConsolidatedFormat,
  ZarrConsolidatedMetadata,
  ZarrMetadataPath,
  ZarrLoader,
  ZarrLoaderOptions
} from './ome-zarr-loader';
export type {
  GeoZarrLevelMetadata,
  GeoZarrAffineTransform,
  GeoZarrSelectionDimension,
  GeoZarrLoaderOptions,
  GeoZarrSourceMetadata,
  GetGeoZarrParameters
} from './geo-zarr-loader';
