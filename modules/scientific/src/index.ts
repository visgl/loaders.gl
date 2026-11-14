// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// loaders.gl

export {NetCDFFormat} from './netcdf/netcdf-format';
export {NetCDFLoader} from './netcdf/netcdf-loader';
export type {NetCDF, NetCDFLoaderOptions} from './netcdf/netcdf-loader';

export type {NetCDFRasterQueryOptions, NetCDFSourceOptions} from './netcdf/netcdf-source-loader';
export {
  OMEZarrLoader,
  GeoZarrLoader,
  ZarrArrayLoader,
  SpatialDataLoader
} from './zarr/zarr-loader-types';
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
} from './zarr/ome-zarr-loader';
export type {
  GeoZarrLevelMetadata,
  GeoZarrAffineTransform,
  GeoZarrSelectionDimension,
  GeoZarrLoaderOptions,
  GeoZarrSourceMetadata,
  GetGeoZarrParameters
} from './zarr/geo-zarr-loader';

export type {
  ScientificArraySource,
  ScientificArray,
  ScientificDatasetMetadata,
  ScientificDimension,
  ScientificVariable,
  ScientificSelection,
  ScientificSourceCapabilities
} from './scientific-array';

export {NPYLoader} from './npy-loader-types';
export type {NPYLoaderOptions} from './npy-loader-types';
export type {NPYTile} from './lib/parsers/parse-npy';
export {NPYFormat} from './npy-format';

export {NRRDLoader} from './nrrd-loader-types';
export type {NRRDData, NRRDArray} from './nrrd/parse-nrrd';

export {VTKLoader} from './vtk-loader-types';
export type {VTKDataset, VTKDataArray, VTKXMLDataset, VTKXMLPiece, VTKXMLArray} from './vtk';
