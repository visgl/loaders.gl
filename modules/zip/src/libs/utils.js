// This file is derived from the tar-js code base under MIT license
// See https://github.com/beatgammit/tar-js/blob/master/LICENSE
/*
 * tar-js
 * MIT (c) 2011 T. Jameson Little
 */

const lookup = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '+',
  '/'
];

/**
 * @param {number} length
 */
export function clean(length) {
  let i;
  const buffer = new Uint8Array(length);
  for (i = 0; i < length; i += 1) {
    buffer[i] = 0;
  }
  return buffer;
}

/**
 * @param {number} num
 * @param {number} bytes
 * @param {number} [base]
 */
export function pad(num, bytes, base) {
  const numStr = num.toString(base || 8);
  return '000000000000'.substr(numStr.length + 12 - bytes) + numStr;
}

/**
 * @param {string} input
 * @param {Uint8Array} [out]
 * @param {number} [offset]
 */
export function stringToUint8(input, out, offset) {
  let i;
  let length;

  out = out || clean(input.length);

  offset = offset || 0;
  for (i = 0, length = input.length; i < length; i += 1) {
    out[offset] = input.charCodeAt(i);
    offset += 1;
  }

  return out;
}
