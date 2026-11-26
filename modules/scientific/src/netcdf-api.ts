// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {NetCDFReader} from './netcdf/netcdfjs/netcdf-reader';
export {openNetCDF4Source} from './netcdf/open-netcdf4-source';
export {parseCFVariableMetadata, decodeCFNumericValues} from './netcdf/cf-conventions';
export {createNetCDFSource} from './netcdf/netcdf-source';
export type {NetCDF, NetCDFLoaderOptions} from './netcdf/netcdf-loader';
export type {NetCDFRasterQueryOptions, NetCDFSourceOptions} from './netcdf/netcdf-source';
export type {CFVariableMetadata} from './netcdf/cf-conventions';
