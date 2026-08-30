// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {inspectWKBHeader} from '@math.gl/wkb';
import type {WellKnownDimension, WKBGeometryType as MathWKBGeometryType} from '@math.gl/wkb';
import type {WKBGeometryType, WKBHeader} from './wkb-types';
import {MAX_SRID, WKT_MAGIC_STRINGS, WKT_MAGIC_BYTES} from './wkb-types';

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
export function isWKT(input: string | ArrayBufferLike): boolean {
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
export function getWKTGeometryType(input: string | ArrayBufferLike): WKBGeometryType | null {
  if (typeof input === 'string') {
    const match = input.match(
      /^(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)(?:\s+(?:ZM|Z|M))?(?:\s|\()/i
    );
    if (!match?.[1]) return null;
    const geometryType = WKT_MAGIC_STRINGS.findIndex(magicString =>
      magicString.startsWith(match[1].toUpperCase())
    );
    return geometryType >= 0 ? ((geometryType + 1) as WKBGeometryType) : null;
  }
  const inputArray = new Uint8Array(input);
  const index = WKT_MAGIC_BYTES.findIndex(magicBytes =>
    magicBytes.every((value, index) => value === inputArray[index])
  );
  return index >= 0 ? ((index + 1) as WKBGeometryType) : null;
}

/**
 * Check if an array buffer might be a TWKB array buffer
 * @param arrayBuffer The array buffer to check
 * @returns false if this is definitely not a TWKB array buffer, true if it might be a TWKB array buffer
 */
export function isTWKB(arrayBuffer: ArrayBufferLike): boolean {
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
export function isWKB(arrayBuffer: ArrayBufferLike): boolean {
  try {
    const header = inspectWKBHeader(arrayBuffer);
    return header.srid === undefined || header.srid <= MAX_SRID;
  } catch {
    return false;
  }
}

/**
 * Parses header and provides a byteOffset to start of geometry data
 * @param dataView
 * @param target optionally supply a WKBHeader object to avoid creating a new object for every call
 * @returns a header object describing the WKB data
 */
export function parseWKBHeader(dataView: DataView, target?: WKBHeader): WKBHeader {
  const text = new TextDecoder().decode(
    new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
  );
  if (isWKT(text)) {
    throw new Error('Cannot parse WKT');
  }
  let header: ReturnType<typeof inspectWKBHeader>;
  try {
    header = inspectWKBHeader(dataView, target?.byteOffset ?? 0);
  } catch (error) {
    const littleEndian = dataView.getUint8(0) === 1;
    const geometryCode = dataView.getUint32(1, littleEndian);
    if (geometryCode >= 1000) {
      throw new Error('Unsupported iso-wkb type');
    }
    throw error;
  }
  return Object.assign(target || {}, {
    type: 'wkb',
    variant: header.dialect,
    geometryType: getGeometryTypeCode(header.geometryType),
    dimensions: getDimensionSize(header.dimension),
    coordinates: header.dimension,
    littleEndian: header.littleEndian,
    byteOffset: header.bodyByteOffset,
    ...(header.srid === undefined ? {} : {srid: header.srid})
  } satisfies WKBHeader);
}

function getGeometryTypeCode(geometryType: MathWKBGeometryType): WKBGeometryType {
  return ([
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ].indexOf(geometryType) + 1) as WKBGeometryType;
}

function getDimensionSize(dimension: WellKnownDimension): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}
