// loaders.gl, MIT license

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeWKB} from './lib/encode-wkb';
import type {Geometry, Feature} from '@loaders.gl/schema';

/**
 * WKB exporter
 */
export const WKBWriter: Writer<Geometry | Feature, never, WriterOptions> = {
  name: 'WKB (Well Known Binary)',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkb'],
  encodeSync: encodeWKB,
  options: {
    wkb: {
      hasZ: false,
      hasM: false
    }
  }
};
