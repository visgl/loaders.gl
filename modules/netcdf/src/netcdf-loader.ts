import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {NetCDFHeader} from './netcdfjs/netcdf-types';

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

/** Preloads the parser-bearing NetCDF loader implementation. */
async function preload() {
  const {NetCDFLoaderWithParser} = await import('./netcdf-loader-with-parser');
  return NetCDFLoaderWithParser;
}

/**
 * Metadata-only loader for NETCDF.
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
  },
  preload
} as const satisfies Loader<NetCDF, never, NetCDFLoaderOptions>;

/**
 * Metadata-only loader for the NetCDF format.
 */
export const NetCDFLoader = {
  ...NetCDFWorkerLoader,
  binary: true
} as const satisfies Loader<NetCDF, never, NetCDFLoaderOptions>;
