// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {isWKB} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    /** Shape is deprecated, only geojson is supported */
    shape: 'geojson-geometry';
  };
};

/**
 * Preloads the parser-bearing WKB loader implementation.
 */
async function preload() {
  const {WKBLoaderWithParser} = await import('./wkb-loader-with-parser');
  return WKBLoaderWithParser;
}

/**
 * Metadata-only worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoader = {
  dataType: null as unknown as Geometry,
  batchType: null as never,
  name: 'WKB',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  worker: true,
  workerFile: 'wkt-classic.js',
  workerModuleFile: 'wkt-module.js',
  workerNodeFile: 'wkt-classic-node.cjs',
  category: 'geometry',
  extensions: ['wkb'],
  mimeTypes: [],
  // TODO can we define static, serializable tests, eg. some binary strings?
  tests: [isWKB],
  options: {
    wkb: {
      shape: 'geojson-geometry'
    }
  },
  preload
} as const satisfies Loader<Geometry, never, WKBLoaderOptions>;

/**
 * Metadata-only loader for WKB (Well-Known Binary)
 */
export const WKBLoader = {
  ...WKBWorkerLoader
} as const satisfies Loader<Geometry, never, WKBLoaderOptions>;
