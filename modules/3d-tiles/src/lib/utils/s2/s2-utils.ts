// s2-geometry is a pure JavaScript port of Google/Niantic's S2 Geometry library
// which is perfect since it works in the browser.
import {
  toHilbertQuadkey,
  FromHilbertQuadKey,
  IJToST,
  STToUV,
  FaceUVToXYZ,
  XYZToLngLat
} from './s2-geometry';
import {toRadians} from '@math.gl/core';
import Long from 'long';

export function getS2QuadKey(token: string): string {
  if (token.indexOf('/') > 0) {
    // is Hilbert quad key
    return token;
  }
  // is S2 token
  const id: Long = getIdFromToken(token);
  return toHilbertQuadkey(id);
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

/**
 * Given an S2 token this function convert the token to 64 bit id
   https://github.com/google/s2-geometry-library-java/blob/c04b68bf3197a9c34082327eeb3aec7ab7c85da1/src/com/google/common/geometry/S2CellId.java#L439
 * */
export function getIdFromToken(token: string): Long {
  if (token === 'X') token = '';
  // pad token with zeros to make the length 16
  const paddedToken = token.padEnd(16, '0');

  const id = Long.fromString(paddedToken, true, 16);
  // To debug
  //  const t = `${getTokenFromId(id)}`; // To debug
  //  if (token !== t) {
  //    console.log(`ERROR: ${t}`);
  //  }
  // To debug
  return id;
}

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

  const x = cellId.shiftRightUnsigned(numZeroDigits); // BigInt(cellId) >> BigInt(numZeroDigits);
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

const MAX_RESOLUTION = 100;

/* Adapted from s2-geometry's S2Cell.getCornerLatLngs */
/* eslint-disable max-statements */
function getGeoBounds({
  face,
  ij,
  level
}: {
  face: number;
  ij: [number, number];
  level: number;
}): Float64Array {
  const offsets = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0]
  ];

  // The S2 cell edge is curved: http://s2geometry.io/
  // This is more prominent at lower levels
  // resolution is the number of segments to generate per edge.
  // We exponentially reduce resolution as level increases so it doesn't affect perf
  // when there are a large number of cells
  const resolution = Math.max(1, Math.ceil(MAX_RESOLUTION * Math.pow(2, -level)));
  const result = new Float64Array(4 * resolution * 2 + 2);
  let ptIndex = 0;
  let prevLng = 0;

  for (let i = 0; i < 4; i++) {
    const offset = offsets[i].slice(0) as [number, number];
    const nextOffset = offsets[i + 1];
    const stepI = (nextOffset[0] - offset[0]) / resolution;
    const stepJ = (nextOffset[1] - offset[1]) / resolution;

    for (let j = 0; j < resolution; j++) {
      offset[0] += stepI;
      offset[1] += stepJ;
      // Cell can be represented by coordinates IJ, ST, UV, XYZ
      // http://s2geometry.io/devguide/s2cell_hierarchy#coordinate-systems
      const st = IJToST(ij, level, offset);
      const uv = STToUV(st);
      const xyz = FaceUVToXYZ(face, uv);
      const lngLat = XYZToLngLat(xyz);

      // Adjust longitude for Web Mercator projection
      if (Math.abs(lngLat[1]) > 89.999) {
        lngLat[0] = prevLng;
      }
      const deltaLng = lngLat[0] - prevLng;
      lngLat[0] += deltaLng > 180 ? -360 : deltaLng < -180 ? 360 : 0;

      result[ptIndex++] = lngLat[0];
      result[ptIndex++] = lngLat[1];
      prevLng = lngLat[0];
    }
  }
  // close the loop
  result[ptIndex++] = result[0];
  result[ptIndex++] = result[1];
  return result;
}
/* eslint-enable max-statements */

export function get2dRegionFromS2Cell(s2cell: {
  face: number;
  ij: [number, number];
  level: number;
}): number[] {
  // const corns = getCornerLngLats(s2cell);
  const corns1 = getGeoBounds(s2cell);
  const region = S2CornersTo2dRegion(corns1);
  return region;
}

/**
 * Get a polygon with corner coordinates for an s2 cell
 * @param {*} cell - This can be an S2 key or token
 * @return {Float64Array} - a simple polygon in flat array format: [lng0, lat0, lng1, lat1, ...]
 *   - the polygon is closed, i.e. last coordinate is a copy of the first coordinate
 */
export function getS2Polygon(token: string): Float64Array {
  const key = getS2QuadKey(token);
  const s2cell = FromHilbertQuadKey(key);

  return getGeoBounds(s2cell);
}

export function getCornerLngLats({
  face,
  ij,
  level
}: {
  face: number;
  ij: [number, number];
  level: number;
}): Float64Array {
  const result: Float64Array = new Float64Array(8);
  const offsets = [
    [0.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
    [1.0, 0.0]
  ];

  let idx = 0;
  for (let i = 0; i < 4; i++) {
    const offset = offsets[i].slice(0) as [number, number];
    const st: [number, number] = IJToST(ij, level, offset);
    const uv: [number, number] = STToUV(st);
    const xyz: [number, number, number] = FaceUVToXYZ(face, uv);
    const lnglat = XYZToLngLat(xyz);
    result[idx++] = lnglat[0]; // lng (in degrees)
    result[idx++] = lnglat[1]; // lat (in degrees)
  }
  return result;
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
  return [
    toRadians(longitudes[0]),
    toRadians(latitudes[0]),
    toRadians(longitudes[longitudes.length - 1]),
    toRadians(latitudes[latitudes.length - 1])
  ];
}
/*
export function s2ToRegion(s2bv: {
  token: string;
  minimumHeight: number;
  maximumHeight: number;
}): number[] {
  const {token, minimumHeight, maximumHeight} = s2bv;
  const key = getS2QuadKey(token);
  const s2cell = FromHilbertQuadKey(key);

  const corns = getCornerLngLats(s2cell);
  const region = S2CornersTo2dRegion(corns);

  return [...region, minimumHeight, maximumHeight];
}
*/
