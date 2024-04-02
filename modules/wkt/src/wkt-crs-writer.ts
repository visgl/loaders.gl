// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

import type {WKTCRS} from './lib/parse-wkt-crs';
import type {EncodeWKTCRSOptions} from './lib/encode-wkt-crs';
import {encodeWKTCRS} from './lib/encode-wkt-crs';

export type WKTCRSWriterOptions = WriterOptions & {
  'wkt-crs'?: EncodeWKTCRSOptions;
};

/**
 * Well-Known text CRS loader
 * @see OGC Standard: https://www.ogc.org/standards/wkt-crs
 * @see Wikipedia Page: https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems
 */
export const WKTCRSWriter = {
  name: 'WKT CRS (Well-Known Text Coordinate Reference System)',
  id: 'wkt-crs',
  module: 'wkt-crs',
  version: VERSION,
  worker: true,
  extensions: [],
  mimeTypes: ['text/plain'],
  // category: 'json',
  text: true,
  options: {
    'wkt-crs': {}
  },
  encode: async (wktcrs, options) =>
    new TextEncoder().encode(encodeWKTCRS(wktcrs, options?.['wkt-crs'])),
  encodeSync: (wktcrs, options) =>
    new TextEncoder().encode(encodeWKTCRS(wktcrs, options?.['wkt-crs'])),
  encodeTextSync: (wktcrs, options) => encodeWKTCRS(wktcrs, options?.['wkt-crs'])
} as const satisfies WriterWithEncoder<WKTCRS, never, WKTCRSWriterOptions>;
