// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {asciiToBase64, base64ToAscii} from './base64-utils';

/**
 * Encode a number (usually a digest from a hash function / cipher) as either hex or base64
 * Suitable for hashes like CRC32 where the number of required bits fit withing a JavaScript number.
 */
export function encodeNumber(number: number, encoding: 'hex' | 'base64'): string {
  switch (encoding) {
    case 'hex':
      return convertNumberToHex(number);
    case 'base64':
      return convertHexToBase64(convertNumberToHex(number));
    default:
      throw new Error(encoding);
  }
}

/** Encode a hex string, aeither return hex or re-encode as base64 */
export function encodeHex(hex: string, encoding: 'hex' | 'base64'): string {
  switch (encoding) {
    case 'hex':
      return hex;
    case 'base64':
      return convertHexToBase64(hex);
    default:
      throw new Error(encoding);
  }
}

export function encodeBase64(base64: string, encoding: 'hex' | 'base64'): string {
  switch (encoding) {
    case 'hex':
      return convertBase64ToHex(base64);
    case 'base64':
      return base64;
    default:
      throw new Error(encoding);
  }
}

/**
 * Convert a hexadecimal string to base64 encoded string representation
 */
function convertHexToBase64(hexstring: string): string {
  // Add leading zero to keep even count of digits
  // eg. f85d741 => 0f85d741
  if (hexstring.length % 2 !== 0) {
    hexstring = `0${hexstring}`;
  }
  const matches = hexstring.match(/\w{2}/g) || [];
  const string = matches.map((a) => String.fromCharCode(parseInt(a, 16))).join('');
  // TODO - define how to handle failures
  return asciiToBase64(string) || '';
}

/**
 * Convert a base64 encoded string to hexadecimal encoded string representation
 */
function convertBase64ToHex(base64String: string): string {
  return [...base64ToAscii(base64String)]
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a number to hex
 */
function convertNumberToHex(cipher: number): string {
  const hexString = cipher.toString(16);
  return hexString === '0' ? `0${hexString}` : hexString;
}
