// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {Geometry} from '@loaders.gl/core/schema';
import {convertGeometryToWKT} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
import {WKT_WRITER_METADATA} from './wkt-writer-types';

export type WKTWriterOptions = WriterOptions & {
  wkt?: {};
};

/**
 * WKT exporter
 */
export const WKTWriter = {
  ...WKT_WRITER_METADATA,
  encode: async (geometry: Geometry) => convertGeometryToWKTSync(geometry),
  encodeSync: convertGeometryToWKTSync,
  encodeTextSync: (geometry: Geometry) => convertGeometryToWKT(geometry)
} as const satisfies WriterWithEncoder<Geometry, never, WKTWriterOptions>;

function convertGeometryToWKTSync(geometry: Geometry): ArrayBuffer {
  const wktString = convertGeometryToWKT(geometry);
  const wktTypedArray = new TextEncoder().encode(wktString);
  return wktTypedArray.buffer;
}
