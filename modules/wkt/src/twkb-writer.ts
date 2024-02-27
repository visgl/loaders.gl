// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeTWKB} from './lib/encode-twkb';
import {Geometry} from '@loaders.gl/schema';

export type TWKBWriterOptions = WriterOptions & {
  twkb?: {
    hasZ?: boolean;
    hasM?: boolean;
  };
};

/**
 * WKB exporter
 */
export const TWKBWriter = {
  name: 'TWKB (Tiny Well Known Binary)',
  id: 'twkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['twkb'],
  encode: async (geometry: Geometry, options?: TWKBWriterOptions) =>
    encodeTWKB(geometry, options?.twkb),
  encodeSync: (geometry: Geometry, options?: TWKBWriterOptions) =>
    encodeTWKB(geometry, options?.twkb),
  options: {
    twkb: {
      hasZ: false,
      hasM: false
    }
  }
} as const satisfies WriterWithEncoder<Geometry, never, TWKBWriterOptions>;
