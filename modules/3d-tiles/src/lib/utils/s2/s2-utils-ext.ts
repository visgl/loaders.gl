import {FromHilbertQuadKey} from './s2-geometry';
import {getS2QuadKey, getGeoBounds} from '../../utils/s2/s2-utils';

import Long from 'long';

function countTrailingZero(x: Long) {
  const count = x.countTrailingZeros();
  return count;
}

export function getTokenFromId(cellId: Long): string {
  if (cellId.isZero()) return 'X';
  let numZeroDigits = countTrailingZero(cellId);

  const remainder = numZeroDigits % 4;
  numZeroDigits = (numZeroDigits - remainder) / 4;
  const trailingZeroHexChars = numZeroDigits;
  numZeroDigits *= 4;

  const x = cellId.shiftRightUnsigned(numZeroDigits);
  const hexString = x.toString(16).replace(/0+$/, '');
  const zeroString = Array(17 - trailingZeroHexChars - hexString.length).join('0');
  return zeroString + hexString;
}

/**
 * Return the lowest-numbered bit that is on for this cell id
 * @private
 */
function lsb(cellId: Long): Long {
  return cellId.and(cellId.not().add(1)); // eslint-disable-line
}

export function getS2ChildCellId(cellId: Long, index: number): Long {
  // Shift sentinel bit 2 positions to the right.
  const newLsb = lsb(cellId).shiftRightUnsigned(2);
  // Insert child index before the sentinel bit.
  const childCellId: Long = cellId.add(Long.fromNumber(2 * index + 1 - 4).multiply(newLsb));
  return childCellId;
}

export function getS2CellFromToken(token: string): {
  face: number;
  ij: [number, number];
  level: number;
} {
  const key = getS2QuadKey(token);
  const s2cell = FromHilbertQuadKey(key);
  return s2cell;
}

function S2CornersTo2dRegion(corners: Float64Array): number[] {
  const longitudes: number[] = [];
  const latitudes: number[] = [];
  for (let i = 0; i < corners.length; i += 2) {
    longitudes.push(corners[i]);
    latitudes.push(corners[i + 1]);
  }
  longitudes.sort((a, b) => a - b);
  latitudes.sort((a, b) => a - b);
  // Return the region in degrees
  return [
    longitudes[0],
    latitudes[0],
    longitudes[longitudes.length - 1],
    latitudes[latitudes.length - 1]
  ];
}

export function get2dRegionFromS2Cell(s2cell: {
  face: number;
  ij: [number, number];
  level: number;
}): number[] {
  const corns = getGeoBounds(s2cell);
  const region = S2CornersTo2dRegion(corns);
  return region;
}
