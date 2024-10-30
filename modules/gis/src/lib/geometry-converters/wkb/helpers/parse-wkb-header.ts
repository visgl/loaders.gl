// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WKBGeometryType, WKBHeader} from './wkb-types';
import {
  EWKB_FLAG_Z,
  EWKB_FLAG_M,
  EWKB_FLAG_SRID,
  MAX_SRID,
  WKT_MAGIC_STRINGS,
  WKT_MAGIC_BYTES
} from './wkb-types';

/** 
 * Check if a string is WKT.
 * @param input A potential WKT geometry string
 * @return `true` if input appears to be a WKT geometry string, `false` otherwise

 * @note We only support the "geojson" subset of the OGC simple features standard
 * @todo Does not handle leading spaces which appear to be permitted per the spec:
 * "A WKT string contains no white space outside of double quotes. 
 * However padding with white space to improve human readability is permitted; 
 * the examples of WKT that are included in this document have 
 * spaces and line feeds inserted to improve clarity. Any padding is stripped out or ignored by parsers."
 */
export function isWKT(input: string | ArrayBuffer): boolean {
  return getWKTGeometryType(input) !== null;
}

/** 
 * Get the geometry type of a WKT string.
 * @param input A potential WKT geometry string
 * @return `true` if input appears to be a WKT geometry string, `false` otherwise

 * @note We only support the "geojson" subset of the OGC simple features standard
 * @todo Does not handle leading spaces which appear to be permitted per the spec:
 * "A WKT string contains no white space outside of double quotes. 
 * However padding with white space to improve human readability is permitted; 
 * the examples of WKT that are included in this document have 
 * spaces and line feeds inserted to improve clarity. Any padding is stripped out or ignored by parsers."
 */
export function getWKTGeometryType(input: string | ArrayBuffer): WKBGeometryType | null {
  if (typeof input === 'string') {
    const index = WKT_MAGIC_STRINGS.findIndex((magicString) => input.startsWith(magicString));
    return index >= 0 ? ((index + 1) as WKBGeometryType) : null;
  }
  const inputArray = new Uint8Array(input);
  const index = WKT_MAGIC_BYTES.findIndex((magicBytes) =>
    magicBytes.every((value, index) => value === inputArray[index])
  );
  return index >= 0 ? ((index + 1) as WKBGeometryType) : null;
}

/**
 * Check if an array buffer might be a TWKB array buffer
 * @param arrayBuffer The array buffer to check
 * @returns false if this is definitely not a TWKB array buffer, true if it might be a TWKB array buffer
 */
export function isTWKB(arrayBuffer: ArrayBuffer): boolean {
  const dataView = new DataView(arrayBuffer);
  const byteOffset = 0;

  const type = dataView.getUint8(byteOffset);
  const geometryType = type & 0x0f;

  // Only geometry types 1 to 7 (point to geometry collection are currently defined)
  if (geometryType < 1 || geometryType > 7) {
    return false;
  }

  return true;
}

/** Sanity checks that first to 5-9 bytes could represent a supported WKB dialect header */
export function isWKB(arrayBuffer: ArrayBuffer): boolean {
  const dataView = new DataView(arrayBuffer);
  let byteOffset = 0;

  const endianness = dataView.getUint8(byteOffset);
  byteOffset += 1;

  // Check valid endianness (only 0 or 1 are allowed)
  if (endianness > 1) {
    return false;
  }

  const littleEndian = endianness === 1;

  const geometry = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  // check valid geometry type (we don't support extension geometries)
  const geometryType = geometry & 0x07;
  if (geometryType === 0 || geometryType > 7) {
    return false;
  }

  const geometryFlags = geometry - geometryType;

  // Accept iso-wkb flags
  if (
    geometryFlags === 0 ||
    geometryFlags === 1000 ||
    geometryFlags === 2000 ||
    geometryFlags === 3000
  ) {
    return true;
  }

  // Accept ewkb flags but reject otherwise
  if ((geometryFlags & ~(EWKB_FLAG_Z | EWKB_FLAG_M | EWKB_FLAG_SRID)) !== 0) {
    return false;
  }

  if (geometryFlags & EWKB_FLAG_SRID) {
    const srid = dataView.getUint32(byteOffset, littleEndian);
    byteOffset += 4;

    if (srid > MAX_SRID) {
      return false;
    }
  }

  return true;
}

/**
 * Parses header and provides a byteOffset to start of geometry data
 * @param dataView
 * @param target optionally supply a WKBHeader object to avoid creating a new object for every call
 * @returns a header object describing the WKB data
 */
// eslint-disable-next-line max-statements, complexity
export function parseWKBHeader(dataView: DataView, target?: WKBHeader): WKBHeader {
  const wkbHeader: WKBHeader = Object.assign(target || {}, {
    type: 'wkb',
    variant: 'wkb',
    geometryType: 1,
    dimensions: 2,
    coordinates: 'xy',
    littleEndian: true,
    byteOffset: 0
  } as WKBHeader);

  if (isWKT(dataView.buffer)) {
    // TODO - WKB header could include WKT type
    throw new Error('WKB: Cannot parse WKT data');
  }

  // Check endianness of data
  wkbHeader.littleEndian = dataView.getUint8(wkbHeader.byteOffset) === 1;
  wkbHeader.byteOffset++;

  // 4-digit code representing dimension and type of geometry
  const geometryCode = dataView.getUint32(wkbHeader.byteOffset, wkbHeader.littleEndian);
  wkbHeader.byteOffset += 4;

  wkbHeader.geometryType = (geometryCode & 0x7) as 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Check if iso-wkb variant: iso-wkb adds 1000, 2000 or 3000 to the geometry code
  const isoType = (geometryCode - wkbHeader.geometryType) / 1000;
  switch (isoType) {
    case 0:
      break;
    case 1:
      wkbHeader.variant = 'iso-wkb';
      wkbHeader.dimensions = 3;
      wkbHeader.coordinates = 'xyz';
      break;
    case 2:
      wkbHeader.variant = 'iso-wkb';
      wkbHeader.dimensions = 3;
      wkbHeader.coordinates = 'xym';
      break;
    case 3:
      wkbHeader.variant = 'iso-wkb';
      wkbHeader.dimensions = 4;
      wkbHeader.coordinates = 'xyzm';
      break;
    default:
      throw new Error(`WKB: Unsupported iso-wkb type: ${isoType}`);
  }

  // Check if EWKB variant. Uses bitmasks for Z&M dimensions as well as optional SRID field
  const ewkbZ = geometryCode & EWKB_FLAG_Z;
  const ewkbM = geometryCode & EWKB_FLAG_M;
  const ewkbSRID = geometryCode & EWKB_FLAG_SRID;

  if (ewkbZ && ewkbM) {
    wkbHeader.variant = 'ewkb';
    wkbHeader.dimensions = 4;
    wkbHeader.coordinates = 'xyzm';
  } else if (ewkbZ) {
    wkbHeader.variant = 'ewkb';
    wkbHeader.dimensions = 3;
    wkbHeader.coordinates = 'xyz';
  } else if (ewkbM) {
    wkbHeader.variant = 'ewkb';
    wkbHeader.dimensions = 3;
    wkbHeader.coordinates = 'xym';
  }

  // If SRID present read four more bytes
  if (ewkbSRID) {
    wkbHeader.variant = 'ewkb';
    // 4-digit code representing dimension and type of geometry
    wkbHeader.srid = dataView.getUint32(wkbHeader.byteOffset, wkbHeader.littleEndian);
    wkbHeader.byteOffset += 4;
  }

  return wkbHeader;
}
