// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseWKBHeader} from './helpers/parse-wkb-header';
import type {WKBHeader} from './helpers/wkb-types';
import {WKBGeometryType} from './helpers/wkb-types';

/** Coordinate bounds extracted directly from one WKB geometry. */
export type WKBGeometryBoundingBox = {
  /** Minimum finite x coordinate. */
  xmin: number;
  /** Maximum finite x coordinate. */
  xmax: number;
  /** Minimum finite y coordinate. */
  ymin: number;
  /** Maximum finite y coordinate. */
  ymax: number;
  /** Minimum finite z coordinate when present. */
  zmin?: number;
  /** Maximum finite z coordinate when present. */
  zmax?: number;
  /** Minimum finite measure coordinate when present. */
  mmin?: number;
  /** Maximum finite measure coordinate when present. */
  mmax?: number;
};

/** Statistics extracted from one WKB geometry without materializing GeoJSON. */
export type WKBGeometryStatistics = {
  /** ISO WKB type code, including the Z/M dimensional offset. */
  geometryType: number;
  /** Coordinate bounds, omitted for geometries without finite x or y coordinates. */
  bbox?: WKBGeometryBoundingBox;
};

type MutableBounds = {
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
};

/**
 * Extracts ISO geometry type and coordinate bounds directly from WKB or EWKB bytes.
 *
 * The scan accepts sliced typed-array views, mixed-endian child geometries, all seven standard
 * geometry families, and XY, XYZ, XYM, and XYZM coordinate layouts.
 */
export function getWKBGeometryStatistics(
  input: ArrayBufferLike | ArrayBufferView
): WKBGeometryStatistics {
  const dataView = getDataView(input);
  const bounds: MutableBounds = {};
  const parsedGeometry = scanGeometry(dataView, 0, bounds);
  if (parsedGeometry.byteOffset !== dataView.byteLength) {
    throw new Error('WKB: Unexpected trailing bytes after geometry');
  }
  return {
    geometryType: getISOTypeCode(parsedGeometry.header),
    bbox: createBoundingBox(bounds)
  };
}

/** Scans one complete WKB geometry and returns the next unread byte offset. */
function scanGeometry(
  dataView: DataView,
  byteOffset: number,
  bounds: MutableBounds
): {byteOffset: number; header: WKBHeader} {
  const header = parseWKBHeader(dataView, {byteOffset} as WKBHeader);
  byteOffset = header.byteOffset;
  switch (header.geometryType) {
    case WKBGeometryType.Point:
      byteOffset = scanPosition(dataView, byteOffset, header, bounds);
      break;
    case WKBGeometryType.LineString:
      byteOffset = scanCoordinateSequence(dataView, byteOffset, header, bounds);
      break;
    case WKBGeometryType.Polygon: {
      const ringCount = dataView.getUint32(byteOffset, header.littleEndian);
      byteOffset += 4;
      for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
        byteOffset = scanCoordinateSequence(dataView, byteOffset, header, bounds);
      }
      break;
    }
    case WKBGeometryType.MultiPoint:
    case WKBGeometryType.MultiLineString:
    case WKBGeometryType.MultiPolygon:
    case WKBGeometryType.GeometryCollection: {
      const geometryCount = dataView.getUint32(byteOffset, header.littleEndian);
      byteOffset += 4;
      for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
        byteOffset = scanGeometry(dataView, byteOffset, bounds).byteOffset;
      }
      break;
    }
    default:
      throw new Error(`WKB: Unsupported geometry type: ${header.geometryType}`);
  }
  return {byteOffset, header};
}

/** Scans a counted coordinate sequence. */
function scanCoordinateSequence(
  dataView: DataView,
  byteOffset: number,
  header: WKBHeader,
  bounds: MutableBounds
): number {
  const pointCount = dataView.getUint32(byteOffset, header.littleEndian);
  byteOffset += 4;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    byteOffset = scanPosition(dataView, byteOffset, header, bounds);
  }
  return byteOffset;
}

/** Scans one coordinate tuple and updates finite per-axis bounds. */
function scanPosition(
  dataView: DataView,
  byteOffset: number,
  header: WKBHeader,
  bounds: MutableBounds
): number {
  const coordinates = new Array<number>(header.dimensions);
  for (let coordinateIndex = 0; coordinateIndex < header.dimensions; coordinateIndex++) {
    coordinates[coordinateIndex] = dataView.getFloat64(byteOffset, header.littleEndian);
    byteOffset += 8;
  }
  updateBounds(bounds, 'x', coordinates[0]);
  updateBounds(bounds, 'y', coordinates[1]);
  if (header.coordinates === 'xyz' || header.coordinates === 'xyzm') {
    updateBounds(bounds, 'z', coordinates[2]);
  }
  if (header.coordinates === 'xym') updateBounds(bounds, 'm', coordinates[2]);
  if (header.coordinates === 'xyzm') updateBounds(bounds, 'm', coordinates[3]);
  return byteOffset;
}

/** Updates one coordinate dimension while ignoring NaN and infinite values. */
function updateBounds(bounds: MutableBounds, dimension: 'x' | 'y' | 'z' | 'm', value: number) {
  if (!Number.isFinite(value)) return;
  const minimumKey = `${dimension}min` as keyof MutableBounds;
  const maximumKey = `${dimension}max` as keyof MutableBounds;
  bounds[minimumKey] =
    bounds[minimumKey] === undefined ? value : Math.min(bounds[minimumKey]!, value);
  bounds[maximumKey] =
    bounds[maximumKey] === undefined ? value : Math.max(bounds[maximumKey]!, value);
}

/** Returns a complete bounding box only when both horizontal dimensions were observed. */
function createBoundingBox(bounds: MutableBounds): WKBGeometryBoundingBox | undefined {
  if (
    bounds.xmin === undefined ||
    bounds.xmax === undefined ||
    bounds.ymin === undefined ||
    bounds.ymax === undefined
  ) {
    return undefined;
  }
  return bounds as WKBGeometryBoundingBox;
}

/** Converts a parsed WKB dialect header into the canonical ISO type code used by Parquet. */
function getISOTypeCode(header: WKBHeader): number {
  const dimensionOffset =
    header.coordinates === 'xyz'
      ? 1000
      : header.coordinates === 'xym'
        ? 2000
        : header.coordinates === 'xyzm'
          ? 3000
          : 0;
  return header.geometryType + dimensionOffset;
}

/** Creates a DataView that respects typed-array slice offsets. */
function getDataView(input: ArrayBufferLike | ArrayBufferView): DataView {
  return ArrayBuffer.isView(input)
    ? new DataView(input.buffer, input.byteOffset, input.byteLength)
    : new DataView(input);
}
