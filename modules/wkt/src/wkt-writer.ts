// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {convertGeometryToWKT} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

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
  encode: async (geometry: Geometry) => convertGeometryToWKTSync(geometry),
  encodeSync: convertGeometryToWKTSync,
  encodeTextSync: convertGeometryToWKT,
  options: {
    wkt: {}
  }
} as const satisfies WriterWithEncoder<Geometry, never, WKTWriterOptions>;

function convertGeometryToWKTSync(geometry: Geometry): ArrayBuffer {
  const wktString = convertGeometryToWKT(geometry);
  const wktTypedArray = new TextEncoder().encode(wktString);
  return wktTypedArray.buffer;
}
