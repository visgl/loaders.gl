// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import type {STACSource} from './stac-source';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for static STAC traversal and STAC API discovery. */
export type STACSourceLoaderOptions = DataSourceOptions & {
  stac?: {
    /** Maximum child depth used by `traverse()` when not overridden per call. */
    maxDepth?: number;
    /** Maximum documents fetched by `traverse()` when not overridden per call. */
    maxRequests?: number;
  };
};

/** Loads the runtime STAC source implementation from its explicit package subpath. */
async function preloadSTACSourceLoader(): Promise<SourceLoader<STACSource>> {
  const {STACSourceLoaderWithParser} = await import('@loaders.gl/stac/stac-source');
  return STACSourceLoaderWithParser;
}

/** Lightweight metadata for static STAC catalogs and STAC API roots. */
export const STACSourceLoader = {
  dataType: null as unknown as STACSource,
  batchType: null as never,
  name: 'STACSourceLoader',
  id: 'stac-source',
  module: 'stac',
  version: VERSION,
  extensions: ['json'],
  mimeTypes: ['application/json', 'application/geo+json'],
  type: 'stac',
  fromUrl: true,
  fromBlob: false,
  options: {
    stac: {
      maxDepth: 32,
      maxRequests: 1000
    }
  },
  defaultOptions: {
    stac: {
      maxDepth: 32,
      maxRequests: 1000
    }
  },
  testURL: (url: string): boolean =>
    /(?:^|[/_.-])stac(?:[/_.?#-]|$)|\/(?:catalog|collection)\.json(?:$|[?#])/i.test(url),
  preload: preloadSTACSourceLoader,
  createDataSource(
    _data: string | Blob,
    _options: STACSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): STACSource {
    throw new Error(
      'STACSourceLoader requires async load() or an explicit @loaders.gl/stac/stac-source import'
    );
  }
} as const satisfies SourceLoader<STACSource>;
