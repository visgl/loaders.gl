// loaders.gl, MIT license
// parse-wkt-crs was forked from https://github.com/DanielJDufour/wkt-crs under Creative Commons CC0 1.0 license.

import type {WKTCRS} from './parse-wkt-crs';

export type EncodeWKTCRSOptions = {
  debug?: boolean;
};

/**
 * convert JSON representation of Well-Known Text
 * back to standard Well-Known Text
 */
export function encodeWKTCRS(wkt: WKTCRS, options?: EncodeWKTCRSOptions): string {
  if (Array.isArray(wkt) && wkt.length === 1 && Array.isArray(wkt[0])) {
    wkt = wkt[0]; // ignore first extra wrapper array
  }

  const [kw, ...attrs] = wkt;
  const str = `${kw}[${attrs
    .map((attr) => {
      if (Array.isArray(attr)) {
        return encodeWKTCRS(attr, options);
      } else if (typeof attr === 'number') {
        return attr.toString();
      } else if (typeof attr === 'string') {
        // can't automatically convert all caps to varibale
        // because EPSG is string in AUTHORITY["EPSG", ...]
        if (attr.startsWith('raw:')) {
          // convert "raw:NORTH" to NORTH
          return attr.replace('raw:', '');
        }
        return `"${attr}"`;
      }
      throw new Error(`[wktcrs] unexpected attribute "${attr}"`);
    })
    .join(',')}]`;
  return str;
}
