// loaders.gl, MIT license

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeTWKB} from './lib/encode-twkb';
import {BinaryGeometry} from '@loaders.gl/schema';

/**
 * WKB exporter
 */
export const TWKBWriter: Writer<BinaryGeometry, never, WriterOptions> = {
  name: 'TWKB (Tiny Well Known Binary)',
  id: 'twkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['twkb'],
  // @ts-expect-error not implemented yet
  encodeSync: async (data: BinaryGeometry, options) => encodeTWKB,
  options: {
    twkb: {
      // hasZ: false,
      // hasM: false
    }
  }
};
