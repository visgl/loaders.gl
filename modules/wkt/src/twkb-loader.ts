// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {BinaryGeometry, Geometry} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import {parseTWKBGeometry, isTWKB} from './lib/parse-twkb';

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    shape: 'geojson-geometry' | 'binary-geometry';
  };
};

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const TWKBWorkerLoader: Loader<Geometry, never, WKBLoaderOptions> = {
  name: 'TWKB (Tiny Well-Known Binary)',
  id: 'twkb',
  module: 'wkt',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['twkb'],
  mimeTypes: [],
  // TODO can we define static, serializable tests, eg. some binary strings?
  tests: [isTWKB],
  options: {
    wkb: {
      shape: 'binary-geometry' // 'geojson-geometry'
    }
  }
};

/**
 * Loader for WKB (Well-Known Binary)
 */
export const TWKBLoader: LoaderWithParser<BinaryGeometry | Geometry, never, WKBLoaderOptions> = {
  ...TWKBWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer) => parseTWKBGeometry(arrayBuffer),
  parseSync: parseTWKBGeometry
};
