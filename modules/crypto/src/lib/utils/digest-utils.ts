import {toBase64} from './base64-utils';

/**
 *
 */
export function toHex(cipher: number): string {
  const hexString = cipher.toString(16);
  return hexString === '0' ? `0${hexString}` : hexString;
}

/**
 * @see https://stackoverflow.com/questions/23190056/hex-to-base64-converter-for-javascript
 */
export function hexToBase64(hexstring: string): string {
  // Add leading zero to keep even count of digits
  // eg. f85d741 => 0f85d741
  if (hexstring.length % 2 !== 0) {
    hexstring = `0${hexstring}`;
  }
  const matches = hexstring.match(/\w{2}/g) || [];
  const string = matches.map((a) => String.fromCharCode(parseInt(a, 16))).join('');
  // TODO - define how to handle failures
  return toBase64(string) || '';
}
