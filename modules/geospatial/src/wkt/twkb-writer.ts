// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {Geometry} from '@loaders.gl/core/schema';
import {convertGeometryToTWKB} from '@loaders.gl/core/wkt/twkb';
import {VERSION} from './lib/version';
import {TWKBFormat} from './wkt-format';

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
  ...TWKBFormat,
  name: 'TWKB (Tiny Well Known Binary)',
  id: 'twkb',
  module: 'geospatial',
  version: VERSION,
  extensions: ['twkb'],
  mimeTypes: ['application/text'],
  encode: async (geometry: Geometry, options?: TWKBWriterOptions) =>
    convertGeometryToTWKB(geometry, options?.twkb),
  encodeSync: (geometry: Geometry, options?: TWKBWriterOptions) =>
    convertGeometryToTWKB(geometry, options?.twkb),
  options: {
    twkb: {
      hasZ: false,
      hasM: false
    }
  }
} as const satisfies WriterWithEncoder<Geometry, never, TWKBWriterOptions>;
