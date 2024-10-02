// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import {encodeWKT} from './lib/encode-wkt';

export type WKTWriterOptions = WriterOptions & {
  wkt?: {};
};

/**
 * WKT exporter
 */
export const WKTWriter = {
  name: 'WKT (Well Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkt'],
  text: true,
  encode: async (geometry: Geometry) => encodeWKTSync(geometry),
  encodeSync: encodeWKTSync,
  encodeTextSync: encodeWKT,
  options: {
    wkt: {}
  }
} as const satisfies WriterWithEncoder<Geometry, never, WKTWriterOptions>;

function encodeWKTSync(geometry: Geometry): ArrayBuffer {
  return new TextEncoder().encode(encodeWKT(geometry)).buffer;
}
