import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import encodeWKB from './lib/encode-wkb';

/**
 * WKB exporter
 */
export const WKBWriter: Writer = {
  name: 'WKB (Well Known Binary)',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkb'],
  // @ts-ignore
  encode: encodeWKB,
  options: {
    wkb: {}
  }
};
