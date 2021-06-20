/** @typedef {import('@loaders.gl/loader-utils').Writer} Writer */
import {VERSION} from './lib/utils/version';
import encodeWKT from './lib/encode-wkt';

/**
 * WKT exporter
 * @type {Writer}
 */
export const WKTWriter = {
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
