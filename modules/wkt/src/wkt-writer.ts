import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import encodeWKT from './lib/encode-wkt';

/**
 * WKT exporter
 */
export const WKTWriter: Writer = {
  name: 'WKT (Well Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkt'],
  // @ts-ignore
  encode: encodeWKT,
  options: {
    wkt: {}
  }
};
