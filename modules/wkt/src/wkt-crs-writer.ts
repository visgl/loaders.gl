// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type WriterWithEncoder,
  type WriterOptions,
  ensureArrayBuffer
} from '@loaders.gl/loader-utils';
import type {WKTCRS, EncodeWKTCRSOptions} from '@loaders.gl/gis';
import {encodeWKTCRS} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

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
    ensureArrayBuffer(new TextEncoder().encode(encodeWKTCRS(wktcrs, options?.['wkt-crs']))),
  encodeSync: (wktcrs, options) =>
    ensureArrayBuffer(new TextEncoder().encode(encodeWKTCRS(wktcrs, options?.['wkt-crs']))),
  encodeTextSync: (wktcrs, options) => encodeWKTCRS(wktcrs, options?.['wkt-crs'])
} as const satisfies WriterWithEncoder<WKTCRS, never, WKTCRSWriterOptions>;
