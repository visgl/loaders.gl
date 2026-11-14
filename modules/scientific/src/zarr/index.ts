// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {loadZarr} from './lib/load-zarr';
export {default as ZarrPixelSource} from './lib/zarr-pixel-source';
export {
  OMEZarrLoaderWithParser as OMEZarrLoader,
  OMEZarrImageSource,
  loadZarrConsolidatedMetadata
} from './ome-zarr-source-loader';
export {
  GeoZarrLoaderWithParser as GeoZarrLoader,
  GeoZarrRasterSource
} from './geo-zarr-source-loader';
export {
  ZarrArrayLoaderWithParser as ZarrArrayLoader,
  ZarrArraySource
} from './zarr-array-source';
export {
  SpatialDataLoaderWithParser as SpatialDataLoader,
  SpatialDataSource
} from './spatial-data-source';
export type {
  GetZarrArrayParameters,
  ZarrArrayData,
  ZarrArraySelection,
  ZarrArraySlice,
  ZarrArraySourceLoaderOptions,
  ZarrArraySourceMetadata
} from './zarr-array-source';
export type {
  SpatialDataElementFormat,
  SpatialDataElementKind,
  SpatialDataElementMetadata,
  SpatialDataSourceLoaderOptions,
  SpatialDataSourceMetadata,
  SpatialDataZarrElementSource
} from './spatial-data-source';
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
  ZarrSourceLoader,
  ZarrSourceLoaderOptions
} from './ome-zarr-source-loader';
export type {
  GeoZarrLevelMetadata,
  GeoZarrAffineTransform,
  GeoZarrSelectionDimension,
  GeoZarrSourceLoaderOptions,
  GeoZarrSourceMetadata,
  GetGeoZarrParameters
} from './geo-zarr-source-loader';
