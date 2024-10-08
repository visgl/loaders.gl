// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {convertGeoJSONToWKT} from '@loaders.gl/gis';
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
  encode: async (geometry: Geometry) => convertGeoJSONToWKTSync(geometry),
  encodeSync: convertGeoJSONToWKTSync,
  encodeTextSync: convertGeoJSONToWKT,
  options: {
    wkt: {}
  }
} as const satisfies WriterWithEncoder<Geometry, never, WKTWriterOptions>;

function convertGeoJSONToWKTSync(geometry: Geometry): ArrayBuffer {
  const wktString = convertGeoJSONToWKT(geometry);
  const wktTypedArray = new TextEncoder().encode(wktString);
  return wktTypedArray.buffer;
}
