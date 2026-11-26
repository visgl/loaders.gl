// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {Geometry} from '@loaders.gl/core/schema';
import {convertGeometryToTWKB} from '@loaders.gl/core/wkt/twkb';
import {TWKB_WRITER_METADATA} from './twkb-writer-types';

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
  ...TWKB_WRITER_METADATA,
  encode: async (geometry: Geometry, options?: TWKBWriterOptions) =>
    convertGeometryToTWKB(geometry, options?.twkb),
  encodeSync: (geometry: Geometry, options?: TWKBWriterOptions) =>
    convertGeometryToTWKB(geometry, options?.twkb)
} as const satisfies WriterWithEncoder<Geometry, never, TWKBWriterOptions>;
