// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import type {ParseWKTCRSOptions, WKTCRS} from './lib/parse-wkt-crs';
import {parseWKTCRS} from './lib/parse-wkt-crs';

export type WKTCRSLoaderOptions = LoaderOptions & {
  'wkt-crs'?: ParseWKTCRSOptions;
};

/**
 * Well-Known text CRS loader
 * @see OGC Standard: https://www.ogc.org/standards/wkt-crs
 * @see Wikipedia Page: https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems
 */
export const WKTCRSLoader: LoaderWithParser<WKTCRS, never, WKTCRSLoaderOptions> = {
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
  parse: async (arrayBuffer, options) =>
    parseWKTCRS(new TextDecoder().decode(arrayBuffer), options?.['wkt-crs']),
  parseTextSync: (string, options) => parseWKTCRS(string, options?.['wkt-crs'])
};
