// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeWKT} from './lib/encode-wkt';
import {Geometry} from '@loaders.gl/schema';

export type WKTWriterOptions = WriterOptions & {
  wkt?: {};
};

/**
 * WKT exporter
 */
export const WKTWriter: WriterWithEncoder<Geometry, never, WKTWriterOptions> = {
  name: 'WKT (Well Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkt'],
  text: true,
  encode: async (geometry) => new TextEncoder().encode(encodeWKT(geometry)).buffer,
  encodeTextSync: encodeWKT,
  options: {
    wkt: {}
  }
};
