// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from './metadata/geoarrow-metadata';
import {getGeoarrowVertexCount} from './get-geoarrow-vertex-count';

/** Resource budgets accepted by GeoArrow conversion entry points. */
export type GeoArrowResourceLimitOptions = {
  /** Maximum serialized bytes across one input vector for WKB or WKT sources. */
  maxGeometryBytes?: number;
  /** Maximum coordinate vertices across one input vector. */
  maxGeometryVertices?: number;
};

/**
 * Validates optional conversion resource budgets and enforces them on one vector.
 *
 * The limits are deliberately opt-in. The byte budget applies to variable-length WKB and WKT
 * payloads; native GeoArrow values are already bounded by their Arrow buffers. The vertex budget
 * applies to every supported source encoding and uses the existing columnar counter rather than
 * materializing GeoJSON objects.
 *
 * @param column GeoArrow vector to check.
 * @param sourceEncoding Declared encoding of the vector.
 * @param options Conversion resource budgets.
 */
export function assertGeoArrowResourceLimits(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  options?: GeoArrowResourceLimitOptions
): void {
  const maximumBytes = getResourceLimit(options?.maxGeometryBytes, 'maxGeometryBytes');
  const maximumVertices = getResourceLimit(options?.maxGeometryVertices, 'maxGeometryVertices');

  if (
    maximumBytes !== undefined &&
    (sourceEncoding === 'geoarrow.wkb' || sourceEncoding === 'geoarrow.wkt')
  ) {
    const byteCount = getVariableLengthByteCount(column, sourceEncoding);
    if (byteCount > maximumBytes) {
      throw new Error(
        `${sourceEncoding} payload exceeds maxGeometryBytes (${maximumBytes}); received ${byteCount} bytes.`
      );
    }
  }

  if (maximumVertices !== undefined) {
    const vertexCount = getGeoarrowVertexCount(column);
    if (vertexCount > maximumVertices) {
      throw new Error(
        `Geometry vector exceeds maxGeometryVertices (${maximumVertices}); received ${vertexCount} vertices.`
      );
    }
  }
}

/** Validates a non-negative safe integer resource budget. */
function getResourceLimit(value: number | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer.`);
  }
  return value;
}

/** Counts serialized bytes in a Binary, BinaryView, Utf8, or Utf8View vector. */
function getVariableLengthByteCount(
  column: arrow.Vector,
  sourceEncoding: 'geoarrow.wkb' | 'geoarrow.wkt'
): number {
  const textEncoder = sourceEncoding === 'geoarrow.wkt' ? new TextEncoder() : null;
  let byteCount = 0;
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) continue;
    if (sourceEncoding === 'geoarrow.wkb') {
      if (ArrayBuffer.isView(value)) {
        byteCount += value.byteLength;
      } else if (value instanceof ArrayBuffer) {
        byteCount += value.byteLength;
      } else {
        throw new Error('geoarrow.wkb values must be ArrayBuffer or ArrayBufferView instances.');
      }
    } else {
      byteCount += textEncoder!.encode(String(value)).byteLength;
    }
  }
  return byteCount;
}
