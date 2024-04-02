// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {BinaryGeometry, Geometry} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import {parseWKB} from './lib/parse-wkb';
import {isWKB} from './lib/parse-wkb-header';

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    /** 'geometry' is deprecated use 'geojson-geometry' */
    shape: 'geojson-geometry' | 'binary-geometry' | 'geometry';
  };
};

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoader = {
  dataType: null as unknown as Geometry | BinaryGeometry,
  batchType: null as never,
  name: 'WKB',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['wkb'],
  mimeTypes: [],
  // TODO can we define static, serializable tests, eg. some binary strings?
  tests: [isWKB],
  options: {
    wkb: {
      shape: 'binary-geometry' // 'geojson-geometry'
    }
  }
} as const satisfies Loader<Geometry | BinaryGeometry, never, WKBLoaderOptions>;

/**
 * Loader for WKB (Well-Known Binary)
 */
export const WKBLoader = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer) => parseWKB(arrayBuffer),
  parseSync: parseWKB
} as const satisfies LoaderWithParser<BinaryGeometry | Geometry, never, WKBLoaderOptions>;
