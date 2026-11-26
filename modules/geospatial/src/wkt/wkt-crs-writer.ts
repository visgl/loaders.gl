// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type WriterWithEncoder,
  type WriterOptions,
  ensureArrayBuffer
} from '@loaders.gl/core/loader-utils';
import {encodeWKTCRS, type EncodeWKTCRSOptions, type WKTCRSAst} from '@math.gl/geospatial/crs';
import {WKTCRS_WRITER_METADATA} from './wkt-crs-writer-types';

export type WKTCRSWriterOptions = WriterOptions & {
  'wkt-crs'?: EncodeWKTCRSOptions;
};

/**
 * Well-Known text CRS loader
 * @see OGC Standard: https://www.ogc.org/standards/wkt-crs
 * @see Wikipedia Page: https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems
 */
export const WKTCRSWriter = {
  ...WKTCRS_WRITER_METADATA,
  encode: async (wktcrs, options) =>
    ensureArrayBuffer(new TextEncoder().encode(encodeWKTCRS(wktcrs, options?.['wkt-crs']))),
  encodeSync: (wktcrs, options) =>
    ensureArrayBuffer(new TextEncoder().encode(encodeWKTCRS(wktcrs, options?.['wkt-crs']))),
  encodeTextSync: (wktcrs, options) => encodeWKTCRS(wktcrs, options?.['wkt-crs'])
} as const satisfies WriterWithEncoder<WKTCRSAst, never, WKTCRSWriterOptions>;
