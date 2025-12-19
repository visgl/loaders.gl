// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright vis.gl contributors

/*
Adapted from s2-geometry under ISC License (ISC)
Copyright (c) 2012-2016, Jon Atkins <github@jonatkins.com>
Copyright (c) 2016, AJ ONeal <aj@daplie.com>
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

import Long from 'long';

//
// Functional Style
//
const FACE_BITS = 3;
const MAX_LEVEL = 30;
const POS_BITS = 2 * MAX_LEVEL + 1; // 61 (60 bits of data, 1 bit lsb marker)
const RADIAN_TO_DEGREE = 180 / Math.PI;

/**
 * An object describing the S2 cell
 * @param face {number} Selects one of the six cube faces. The value is in the range [0..5]
 * @param ij {[number, number]} “i” and “j” are integers in the range [0..2**30-1] that identify the cell.
 * @param level {number} The number of times the cell has been subdivided (starting with a face cell). The value is in the range [0..30]
 */
export type S2Cell = {
  face: number;
  ij: [number, number];
  level: number;
};

/**
 * Return the S2Cell
 * @param hilbertQuadkey {string} A string that is the Hilbert quad key (containing /)
 * @returns {@link S2Cell}
 */
// eslint-disable-next-line max-statements
export function getS2CellFromQuadKey(hilbertQuadkey: string): S2Cell {
  if (hilbertQuadkey.length === 0) {
    throw new Error(`Invalid Hilbert quad key ${hilbertQuadkey}`);
  }
  const parts: string[] = hilbertQuadkey.split('/');
  const face: number = parseInt(parts[0], 10); // face is in the range [0..5]
  const position: string = parts[1]; // position is in the range [0..4**30-1]
  const maxLevel: number = position.length;
  let level = 0;

  const point = [0, 0] as [number, number];

  for (let i = maxLevel - 1; i >= 0; i--) {
    level = maxLevel - i;
    const bit = position[i];
    let rx = 0;
    let ry = 0;
    if (bit === '1') {
      ry = 1;
    } else if (bit === '2') {
      rx = 1;
      ry = 1;
    } else if (bit === '3') {
      rx = 1;
    }

    const val = Math.pow(2, level - 1);
    rotateAndFlipQuadrant(val, point, rx, ry);

    point[0] += val * rx;
    point[1] += val * ry;
  }

  if (face % 2 === 1) {
    const t = point[0];
    point[0] = point[1];
    point[1] = t;
  }

  return {face, ij: point, level};
}

/**
 * Convets S2 cell ID to the Hilbert quad key
 * @param cellId {Long} Cell id that is a 64-bit encoding of a face and a Hilbert curve parameter on that face
 * @returns {string} the Hilbert quad key (containing /) as a string in the format 'face/pos', where
 *  - face is a 10-base representation of the face number
 *  - pos is a 4-base representation of the position along the Hilbert curve. For example,
 *    pos == '13' means the following:
 *       The face is divided two times. After the first time the child cell with position 1 will be selected.
 *       Then, this cell will be divided the second time, and the child cell with position 3 will be selected.
 */
export function getS2QuadkeyFromCellId(cellId: Long): string {
  if (cellId.isZero()) {
    // Invalid token
    return '';
  }

  let bin = cellId.toString(2);

  while (bin.length < FACE_BITS + POS_BITS) {
    // eslint-disable-next-line prefer-template
    bin = '0' + bin;
  }

  // MUST come AFTER binstr has been left-padded with '0's
  const lsbIndex = bin.lastIndexOf('1');
  // substring(start, end) // includes start, does not include end
  const faceB = bin.substring(0, 3);
  // posB will always be a multiple of 2 (or it's invalid)
  const posB = bin.substring(3, lsbIndex);
  const levelN = posB.length / 2;

  const faceS = Long.fromString(faceB, true, 2).toString(10);

  /*
    Here is a fix for the case when posB is an empty string that causes an exception in Long.fromString
  */
  let posS = '';
  if (levelN !== 0) {
    // posB is not an empty string, because levelN !== 0
    posS = Long.fromString(posB, true, 2).toString(4);

    while (posS.length < levelN) {
      // eslint-disable-next-line prefer-template
      posS = '0' + posS;
    }
  }
  // Note, posS will be "" for the level==0, which corresponds to the full face.
  // Example: Full face 0 (No subdivision, so level==0): Returns "0/"
  // TODO: Is it ok?

  return `${faceS}/${posS}`;
}

/**
 * Convets S2 the Hilbert quad key to cell ID.
 * @param quadkey {string} The Hilbert quad key (containing /) as a string in the format 'face/pos'
 * @returns {Long} Cell id that is a 64-bit encoding of a face and a Hilbert curve parameter on that face
 */
/* eslint complexity: ["error", { "max": 14 }] */
export function getS2CellIdFromQuadkey(hilbertQuadkey: string): Long {
  if (hilbertQuadkey.length === 0 || hilbertQuadkey.indexOf('/') !== 1) {
    throw new Error(`Invalid Hilbert quad key ${hilbertQuadkey}`);
  }

  let idS = '';

  const faceS = hilbertQuadkey[0];
  switch (faceS) {
    case '0':
      idS += '000';
      break;
    case '1':
      idS += '001';
      break;
    case '2':
      idS += '010';
      break;
    case '3':
      idS += '011';
      break;
    case '4':
      idS += '100';
      break;
    case '5':
      idS += '101';
      break;
    default:
      throw new Error(`Invalid Hilbert quad key ${hilbertQuadkey}`);
  }

  const maxLevel: number = hilbertQuadkey.length;
  // Don't convert position to Long, because it can contain leading zeros, which makes you handle it later.

  for (let i = 2; i < maxLevel; i++) {
    // The first char is a face, the second char is '/'
    const p = hilbertQuadkey[i];
    switch (p) {
      case '0':
        idS += '00';
        break;
      case '1':
        idS += '01';
        break;
      case '2':
        idS += '10';
        break;
      case '3':
        idS += '11';
        break;
      default:
        throw new Error(`Invalid Hilbert quad key ${hilbertQuadkey}`);
    }
  }
  // Append the sentinel bit
  idS += '1';

  const paddedId = idS.padEnd(64, '0');
  const id = Long.fromString(paddedId, true, 2);
  return id;
}

export function IJToST(
  ij: [number, number],
  level: number,
  offsets: [number, number]
): [number, number] {
  const maxSize = 1 << level;

  return [(ij[0] + offsets[0]) / maxSize, (ij[1] + offsets[1]) / maxSize];
}

function singleSTtoUV(st: number): number {
  if (st >= 0.5) {
    return (1 / 3.0) * (4 * st * st - 1);
  }
  return (1 / 3.0) * (1 - 4 * (1 - st) * (1 - st));
}

export function STToUV(st: [number, number]): [number, number] {
  return [singleSTtoUV(st[0]), singleSTtoUV(st[1])];
}

export function FaceUVToXYZ(face: number, [u, v]: [number, number]): [number, number, number] {
  switch (face) {
    case 0:
      return [1, u, v];
    case 1:
      return [-u, 1, v];
    case 2:
      return [-u, -v, 1];
    case 3:
      return [-1, -v, -u];
    case 4:
      return [v, -1, -u];
    case 5:
      return [v, u, -1];
    default:
      throw new Error('Invalid face');
  }
}

export function XYZToLngLat([x, y, z]: [number, number, number]): [number, number] {
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lng = Math.atan2(y, x);

  return [lng * RADIAN_TO_DEGREE, lat * RADIAN_TO_DEGREE];
}

function rotateAndFlipQuadrant(n: number, point: [number, number], rx: number, ry: number): void {
  if (ry === 0) {
    if (rx === 1) {
      point[0] = n - 1 - point[0];
      point[1] = n - 1 - point[1];
    }

    const x = point[0];
    point[0] = point[1];
    point[1] = x;
  }
}

/**
 * Retrieve S2 geometry center
 * @param s2cell {S2Cell} S2 cell
 * @returns {[number, number]} Longitude and Latitude coordinates of the S2 cell's center
 */
export function getS2LngLatFromS2Cell(s2Cell: S2Cell): [number, number] {
  const st = IJToST(s2Cell.ij, s2Cell.level, [0.5, 0.5]);
  const uv = STToUV(st);
  const xyz = FaceUVToXYZ(s2Cell.face, uv);

  return XYZToLngLat(xyz);
}

/**
 * Return longitude and latitude of four corners of the cell.
 * @param s2Cell {S2Cell} S2 cell
 * @returns {Array<[number, number]>} Array of longitude and latitude pairs (in degrees) for four corners of the cell.
 */
export function getCornerLngLats(s2Cell: S2Cell): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  const offsets: Array<[number, number]> = [
    [0.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
    [1.0, 0.0]
  ];

  for (let i = 0; i < 4; i++) {
    const st = IJToST(s2Cell.ij, s2Cell.level, offsets[i]);
    const uv = STToUV(st);
    const xyz = FaceUVToXYZ(s2Cell.face, uv);

    result.push(XYZToLngLat(xyz));
  }
  return result;
}
