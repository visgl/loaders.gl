// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {inspectWKBHeader, inspectWKTHeader} from '@math.gl/core/arrow';
import type {WellKnownDimension, WKBGeometryType as MathWKBGeometryType} from '@math.gl/core/arrow';
import type {WKBGeometryType, WKBHeader} from './wkb-types';
import {MAX_SRID, WKT_MAGIC_STRINGS, WKT_MAGIC_BYTES} from './wkb-types';

/** Checks whether the input starts with a supported WKT geometry header. */
export function isWKT(input: string | ArrayBufferLike): boolean {
  return getWKTGeometryType(input) !== null;
}

/** Classifies string WKT/EWKT headers or binary WKT prefixes without parsing coordinates. */
export function getWKTGeometryType(input: string | ArrayBufferLike): WKBGeometryType | null {
  if (typeof input === 'string') {
    const header = inspectWKTHeader(input);
    if (!header) return null;
    const geometryType = WKT_MAGIC_STRINGS.findIndex(magicString =>
      magicString.startsWith(header.geometryType.toUpperCase())
    );
    return geometryType >= 0 ? ((geometryType + 1) as WKBGeometryType) : null;
  }
  const inputArray = new Uint8Array(input);
  const index = WKT_MAGIC_BYTES.findIndex(magicBytes =>
    magicBytes.every((value, index) => value === inputArray[index])
  );
  return index >= 0 ? ((index + 1) as WKBGeometryType) : null;
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
