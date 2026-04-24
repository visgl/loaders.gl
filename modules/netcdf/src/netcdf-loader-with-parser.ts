import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {NetCDFHeader} from './netcdfjs/netcdf-types';
import {NetCDFReader} from './netcdfjs/netcdf-reader';
import {NetCDFWorkerLoader as NetCDFWorkerLoaderMetadata} from './netcdf-loader';
import {NetCDFLoader as NetCDFLoaderMetadata} from './netcdf-loader';

const {preload: _NetCDFWorkerLoaderPreload, ...NetCDFWorkerLoaderMetadataWithoutPreload} =
  NetCDFWorkerLoaderMetadata;
const {preload: _NetCDFLoaderPreload, ...NetCDFLoaderMetadataWithoutPreload} = NetCDFLoaderMetadata;

export type NetCDF = {
  loaderData: NetCDFHeader;
  data: {[variableName: string]: any[][]};
};

export type NetCDFLoaderOptions = LoaderOptions & {
  netcdf?: {
    loadData?: boolean;
    loadVariables?: boolean;
  };
};

/**
 * Worker loader for NETCDF
 */
export const NetCDFWorkerLoaderWithParser = {
  ...NetCDFWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<NetCDF, never, NetCDFLoaderOptions>;

/**
 * Loader for the NetCDF format
 */
export const NetCDFLoaderWithParser = {
  ...NetCDFLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => parseNetCDF(arrayBuffer, options)
} as const satisfies LoaderWithParser<NetCDF, never, NetCDFLoaderOptions>;

function parseNetCDF(arrayBuffer: ArrayBuffer, options?: NetCDFLoaderOptions): NetCDF {
  const reader = new NetCDFReader(arrayBuffer);
  const variables: {[variableName: string]: any[][]} = {};
  if (options?.netcdf?.loadData) {
    for (const variable of reader.variables) {
      variables[variable.name] = reader.getDataVariable(variable);
    }
  }
  return {
    loaderData: reader.header,
    data: variables
  };
}
