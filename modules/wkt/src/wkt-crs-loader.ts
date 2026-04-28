// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseWKTCRSOptions, WKTCRS} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

export type WKTCRSLoaderOptions = LoaderOptions & {
  'wkt-crs'?: ParseWKTCRSOptions;
};

/**
 * Preloads the parser-bearing WKT CRS loader implementation.
 */
async function preload() {
  const {WKTCRSLoaderWithParser} = await import('./wkt-crs-loader-with-parser');
  return WKTCRSLoaderWithParser;
}

/**
 * Metadata-only Well-Known text CRS loader
 * @see OGC Standard: https://www.ogc.org/standards/wkt-crs
 * @see Wikipedia Page: https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems
 */
export const WKTCRSLoader = {
  dataType: null as unknown as WKTCRS,
  batchType: null as never,
  name: 'WKT CRS (Well-Known Text Coordinate Reference System)',
  id: 'wkt-crs',
  module: 'wkt-crs',
  version: VERSION,
  worker: true,
  workerFile: 'wkt-classic.js',
  workerModuleFile: 'wkt-module.js',
  workerNodeFile: 'wkt-classic-node.cjs',
  extensions: [],
  mimeTypes: ['text/plain'],
  category: 'json',
  text: true,
  options: {
    'wkt-crs': {}
  },
  preload
} as const satisfies Loader<WKTCRS, never, WKTCRSLoaderOptions>;
