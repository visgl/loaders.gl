import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import encodeWKB from './lib/encode-wkb';

/**
 * WKT exporter
 */
export const WKBWriter: Writer = {
  name: 'WKB (Well Known Binary)',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkb'],
  // @ts-ignore
  encodeSync: encodeWKB,
  options: {
    wkt: {
      hasZ: false,
      hasM: false
    }
  }
};
