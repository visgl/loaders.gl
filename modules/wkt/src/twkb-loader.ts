// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {BinaryGeometry, Geometry} from '@loaders.gl/schema';
import {convertTWKBToGeometry, isTWKB} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    shape: 'geojson-geometry' | 'binary-geometry';
  };
};

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const TWKBWorkerLoader = {
  dataType: null as unknown as Geometry,
  batchType: null as never,

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
} as const satisfies Loader<Geometry, never, WKBLoaderOptions>;

/**
 * Loader for WKB (Well-Known Binary)
 */
export const TWKBLoader = {
  ...TWKBWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer) => convertTWKBToGeometry(arrayBuffer),
  parseSync: convertTWKBToGeometry
} as const satisfies LoaderWithParser<BinaryGeometry | Geometry, never, WKBLoaderOptions>;
