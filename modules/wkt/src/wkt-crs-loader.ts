// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseWKTCRSOptions, WKTCRSAst} from '@math.gl/crs';
import {VERSION} from './lib/version';
import {WKTCRSFormat} from './wkt-format';

export type WKTCRSLoaderOptions = LoaderOptions & {
  'wkt-crs'?: ParseWKTCRSOptions;
};

/**
 * Preloads the parser-bearing WKT CRS loader implementation.
 */
async function preload() {
  const {WKTCRSLoaderWithParser} = await import('@loaders.gl/wkt/wkt-crs-loader');
  return WKTCRSLoaderWithParser;
}

/**
 * Metadata-only Well-Known text CRS loader
 * @see OGC Standard: https://www.ogc.org/standards/wkt-crs
 * @see Wikipedia Page: https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems
 */
export const WKTCRSLoader = {
  ...WKTCRSFormat,
  dataType: null as unknown as WKTCRSAst,
  batchType: null as never,
  name: 'WKT CRS (Well-Known Text Coordinate Reference System)',
  id: 'wkt-crs',
  module: 'wkt-crs',
  version: VERSION,
  worker: true,
  extensions: [],
  mimeTypes: ['text/plain'],
  category: 'json',
  text: true,
  options: {
    'wkt-crs': {}
  },
  preload
} as const satisfies Loader<WKTCRSAst, never, WKTCRSLoaderOptions>;
