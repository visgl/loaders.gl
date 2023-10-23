// loaders.gl, MIT license

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeWKT} from './lib/encode-wkt';
import {Geometry} from '@loaders.gl/schema';

export type WKTWriterOptions = WriterOptions & {
  wkt?: {};
};

/**
 * WKT exporter
 */
export const WKTWriter: Writer<Geometry, never, WKTWriterOptions> = {
  name: 'WKT (Well Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkt'],
  // @ts-expect-error
  encodeSync: encodeWKT,
  options: {
    wkt: {}
  }
};
