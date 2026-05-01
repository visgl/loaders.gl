// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {VERSION} from './lib/version';
import {WKBFormat} from './wkt-format';

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
  ...WKBFormat,
  version: VERSION,
  worker: true,
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
