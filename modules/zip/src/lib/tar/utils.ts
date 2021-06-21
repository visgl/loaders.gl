// This file is derived from the tar-js code base under MIT license
// See https://github.com/beatgammit/tar-js/blob/master/LICENSE
/*
 * tar-js
 * MIT (c) 2011 T. Jameson Little
 */

export function clean(length: number) {
  let i: number;
  const buffer = new Uint8Array(length);
  for (i = 0; i < length; i += 1) {
    buffer[i] = 0;
  }
  return buffer;
}

export function pad(num: number, bytes: number, base?: number) {
  const numStr = num.toString(base || 8);
  return '000000000000'.substr(numStr.length + 12 - bytes) + numStr;
}

export function stringToUint8(input: string, out?: Uint8Array, offset?: number) {
  let i: number;
  let length: number;

  out = out || clean(input.length);

  offset = offset || 0;
  for (i = 0, length = input.length; i < length; i += 1) {
    out[offset] = input.charCodeAt(i);
    offset += 1;
  }

  return out;
}
