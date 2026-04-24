// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

/** SHPLoader */
export type SHPLoaderOptions = StrictLoaderOptions & {
  shp?: {
    _maxDimensions?: number;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing SHP loader implementation. */
async function preload() {
  const {SHPLoaderWithParser} = await import('./shp-loader-with-parser');
  return SHPLoaderWithParser;
}

/** Metadata-only SHP worker loader. */
export const SHPWorkerLoader = {
  dataType: null as unknown,
  batchType: null as never,

  name: 'SHP',
  id: 'shp',
  module: 'shapefile',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  // ISSUE: This also identifies SHX files, which are identical to SHP for the first 100 bytes...
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shp: {
      _maxDimensions: 4
    }
  },
  preload
} as const satisfies Loader<any, any, SHPLoaderOptions>;

/** Metadata-only SHP file loader. */
export const SHPLoader: Loader<any, any, SHPLoaderOptions> = {
  ...SHPWorkerLoader,
  preload
};
