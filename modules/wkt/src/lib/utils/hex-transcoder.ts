// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

// Forked from https://github.com/jessetane/hex-transcoder under MIT license

const alphabet = '0123456789abcdef';
const encodeLookup: string[] = [];
const decodeLookup: number[] = [];

for (let i = 0; i < 256; i++) {
  encodeLookup[i] = alphabet[(i >> 4) & 0xf] + alphabet[i & 0xf];
  if (i < 16) {
    if (i < 10) {
      decodeLookup[0x30 + i] = i;
    } else {
      decodeLookup[0x61 - 10 + i] = i;
    }
  }
}

/**
 * Encode a Uint8Array to a hex string
 *
 * @param  array Bytes to encode to string
 * @return hex string
 */
export function encodeHex(array: Uint8Array): string {
  const length = array.length;
  let string = '';
  let i = 0;
  while (i < length) {
    string += encodeLookup[array[i++]];
  }
  return string;
}

/**
 * Decodes a hex string to a Uint8Array
 *
 * @param string hex string to decode to Uint8Array
 * @return Uint8Array
 */
export function decodeHex(string: string): Uint8Array {
  const sizeof = string.length >> 1;
  const length = sizeof << 1;
  const array = new Uint8Array(sizeof);
  let n = 0;
  let i = 0;
  while (i < length) {
    array[n++] = (decodeLookup[string.charCodeAt(i++)] << 4) | decodeLookup[string.charCodeAt(i++)];
  }
  return array;
}
