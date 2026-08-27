// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {NetCDFFormat} from './netcdf-format';
import type {NetCDFSource, NetCDFSourceOptions} from './netcdf-source-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the parser-bearing NetCDF source through its explicit implementation subpath. */
async function preloadNetCDFSourceLoader(): Promise<SourceLoader<NetCDFSource>> {
  const {NetCDFSourceLoaderWithParser} = await import('@loaders.gl/netcdf/netcdf-source-loader');
  return NetCDFSourceLoaderWithParser;
}

/** Metadata-only NetCDF source loader kept lightweight for package-root imports. */
export const NetCDFSourceLoader = {
  ...NetCDFFormat,
  dataType: null as unknown as NetCDFSource,
  batchType: null as never,
  name: 'NetCDFSourceLoader',
  version: VERSION,
  type: 'netcdf-source',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.(?:cdf|nc)(?:$|[?#])/i.test(url),
  preload: preloadNetCDFSourceLoader,
  createDataSource(
    _data: string | Blob,
    _options: NetCDFSourceOptions,
    _coreApi?: CoreAPI
  ): NetCDFSource {
    throw new Error(
      'NetCDFSourceLoader requires async load() or an explicit @loaders.gl/netcdf/netcdf-source-loader import'
    );
  }
} as const satisfies SourceLoader<NetCDFSource>;
