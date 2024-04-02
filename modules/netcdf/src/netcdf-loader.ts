import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {NetCDFHeader} from './netcdfjs/netcdf-types';
import {NetCDFReader} from './netcdfjs/netcdf-reader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
export const NetCDFWorkerLoader = {
  dataType: null as unknown as NetCDF,
  batchType: null as never,

  name: 'NetCDF',
  id: 'mvt',
  module: 'mvt',
  version: VERSION,
  extensions: ['cdf', 'nc'],
  mimeTypes: [
    'application/netcdf',
    'application/x-netcdf'
    // 'application/octet-stream'
  ],
  category: 'image',
  options: {
    netcdf: {
      loadVariables: false
    }
  }
} as const satisfies Loader<NetCDF, never, NetCDFLoaderOptions>;

/**
 * Loader for the NetCDF format
 */
export const NetCDFLoader = {
  ...NetCDFWorkerLoader,
  parse: async (arrayBuffer, options) => parseNetCDF(arrayBuffer, options),
  binary: true
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
