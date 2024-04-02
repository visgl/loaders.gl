// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseWKT} from './lib/parse-wkt';
import {Geometry} from '@loaders.gl/schema';
import {isWKT, WKT_MAGIC_STRINGS} from './lib/parse-wkt';

export type WKTLoaderOptions = LoaderOptions & {
  /** Options for the WKT parser */
  wkt?: {
    shape?: 'geojson-geometry'; // 'binary-geometry'
    /** Whether to add any CRS, if found, as undocumented CRS property on the returned geometry */
    crs?: boolean;
  };
};

/**
 * Well-Known text worker loader
 */
export const WKTWorkerLoader = {
  dataType: null as unknown as Geometry,
  batchType: null as never,

  name: 'WKT (Well-Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  worker: true,
  extensions: ['wkt'],
  mimeTypes: ['text/plain'],
  category: 'geometry',
  text: true,
  tests: WKT_MAGIC_STRINGS,
  testText: isWKT,
  options: {
    wkt: {
      shape: 'geojson-geometry',
      crs: true
    }
  }
} as const satisfies Loader<Geometry, never, WKTLoaderOptions>;

/**
 * Well-Known text loader
 */
export const WKTLoader = {
  ...WKTWorkerLoader,
  parse: async (arrayBuffer, options?) => parseWKT(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (string: string, options?) => parseWKT(string, options)
} as const satisfies LoaderWithParser<Geometry, never, WKTLoaderOptions>;
