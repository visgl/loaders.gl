// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {loadZarr} from './zarr/lib/load-zarr';
export {loadZarrConsolidatedMetadata} from './zarr/ome-zarr-loader';
export type {
  GetZarrArrayParameters,
  ZarrArrayData,
  ZarrArraySelection,
  ZarrArraySlice,
  ZarrArrayLoaderOptions,
  ZarrArraySourceMetadata
} from './zarr/zarr-array-loader';
export type {
  SpatialDataElementFormat,
  SpatialDataElementKind,
  SpatialDataElementMetadata,
  SpatialDataLoaderOptions,
  SpatialDataSourceMetadata,
  SpatialDataZarrElementSource
} from './zarr/spatial-data-loader';
export type {
  GetOMEZarrParameters,
  LoadZarrConsolidatedMetadataOptions,
  OMEZarrChannelMetadata,
  OMEZarrLevelMetadata,
  OMEZarrSourceLoaderMetadata,
  ZarrLoader,
  ZarrLoaderOptions
} from './zarr/ome-zarr-loader';
export type {
  LoadConsolidatedMetadataOptions,
  ZarrConsolidatedFormat,
  ZarrConsolidatedMetadata,
  ZarrMetadataPath
} from './zarr/lib/consolidated-zarr';
export type {
  GeoZarrLevelMetadata,
  GeoZarrAffineTransform,
  GeoZarrSelectionDimension,
  GeoZarrLoaderOptions,
  GeoZarrSourceMetadata,
  GetGeoZarrParameters
} from './zarr/geo-zarr-loader';
