import {toBase64} from './base64-utils';

/**
 *
 */
export function toHex(cipher) {
  const hexString = cipher.toString(16);
  return hexString === '0' ? `0${hexString}` : hexString;
}

/**
 *
 */
export function hexToBase64(hexstring) {
  const string = hexstring
    .match(/\w{2}/g)
    .map(a => String.fromCharCode(parseInt(a, 16)))
    .join('');
  return toBase64(string);
}
