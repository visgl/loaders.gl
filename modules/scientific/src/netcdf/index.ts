// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {NetCDFReader} from './netcdfjs/netcdf-reader';
export {NetCDFFormat} from './netcdf-format';
export {NetCDFLoader} from './netcdf-loader';
export type {NetCDF, NetCDFLoaderOptions} from './netcdf-loader';
export {NetCDFLoaderWithParser, NetCDFWorkerLoaderWithParser} from './netcdf-loader-with-parser';
export {NetCDFSource} from './netcdf-source-loader';
export type {NetCDFRasterQueryOptions, NetCDFSourceOptions} from './netcdf-source-loader';

export {NetCDF4Source} from './netcdf4-source';

export {openNetCDF4Source} from './open-netcdf4-source';

export {parseCFVariableMetadata, decodeCFNumericValues} from './cf-conventions';
export type {CFVariableMetadata} from './cf-conventions';
