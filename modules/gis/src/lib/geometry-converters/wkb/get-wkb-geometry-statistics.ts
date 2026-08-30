// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {scanWKB} from '@math.gl/wkb';
import type {WellKnownDimension, WKBGeometryType} from '@math.gl/wkb';

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

/**
 * Extracts ISO geometry type and coordinate bounds directly from WKB or EWKB bytes.
 *
 * This compatibility wrapper delegates allocation-free traversal, mixed endian handling, and
 * defensive nesting limits to `@math.gl/wkb`.
 */
export function getWKBGeometryStatistics(
  input: ArrayBufferLike | ArrayBufferView
): WKBGeometryStatistics {
  const statistics = scanWKB(input);
  return {
    geometryType:
      getGeometryTypeCode(statistics.header.geometryType) +
      getDimensionOffset(statistics.header.dimension),
    ...(statistics.bounds ? {bbox: {...statistics.bounds}} : {})
  };
}

function getGeometryTypeCode(geometryType: WKBGeometryType): number {
  return (
    [
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
      'GeometryCollection'
    ].indexOf(geometryType) + 1
  );
}

function getDimensionOffset(dimension: WellKnownDimension): number {
  return dimension === 'xyz' ? 1000 : dimension === 'xym' ? 2000 : dimension === 'xyzm' ? 3000 : 0;
}
