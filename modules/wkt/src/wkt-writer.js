import encodeWKT from './lib/encode-wkt';

export const WKTWriter = {
  id: 'wkt',
  name: 'WKT (Well Known Text)',
  extensions: ['wkt'],
  encode: encodeWKT,
  options: {
    wkt: {}
  }
};
