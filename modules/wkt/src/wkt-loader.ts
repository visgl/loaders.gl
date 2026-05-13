// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {VERSION} from './lib/version';
import {WKTFormat} from './wkt-format';

export type WKTLoaderOptions = LoaderOptions & {
  /** Options for the WKTLoader */
  wkt?: {
    /** Shape of returned geometry */
    shape?: 'geojson-geometry'; // 'binary-geometry'
    /** Whether to add any CRS, if found, as undocumented CRS property on the returned geometry */
    crs?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Preloads the parser-bearing WKT loader implementation.
 */
async function preload() {
  const {WKTLoaderWithParser} = await import('./wkt-loader-with-parser');
  return WKTLoaderWithParser;
}

/**
 * Metadata-only Well-Known text worker loader
 */
export const WKTWorkerLoader = {
  dataType: null as unknown as Geometry,
  batchType: null as never,

  ...WKTFormat,
  version: VERSION,
  worker: true,
  options: {
    wkt: {
      shape: 'geojson-geometry',
      crs: true
    }
  },
  preload
} as const satisfies Loader<Geometry, never, WKTLoaderOptions>;

/**
 * Metadata-only Well-Known text loader
 */
export const WKTLoader = {
  ...WKTWorkerLoader
} as const satisfies Loader<Geometry, never, WKTLoaderOptions>;
