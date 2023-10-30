// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {SHPResult} from './lib/parsers/parse-shp';
import {parseSHP, parseSHPInBatches} from './lib/parsers/parse-shp';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

export type SHPLoaderOptions = LoaderOptions & {
  shp?: {
    _maxDimensions?: number;
  };
};

/**
 * SHP file loader
 */
export const SHPWorkerLoader: Loader<SHPResult, SHPResult, SHPLoaderOptions> = {
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
  }
};

/** SHP file loader */
export const SHPLoader: LoaderWithParser<SHPResult, SHPResult, SHPLoaderOptions> = {
  ...SHPWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: SHPLoaderOptions) => parseSHP(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: SHPLoaderOptions) => parseSHP(arrayBuffer, options),
  parseInBatches: (
    arrayBufferIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    options?: SHPLoaderOptions
  ) => parseSHPInBatches(arrayBufferIterator, options)
};
