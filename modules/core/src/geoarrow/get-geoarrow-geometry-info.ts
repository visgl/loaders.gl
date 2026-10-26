// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from './metadata/geoarrow-metadata';
import {
  inspectGeoArrowLayout,
  type GeoArrowLayoutInspection,
  type GeoArrowLayoutKind
} from './geoarrow-layout';

/**
 * @see https://geoarrow.org/format.html#memory-layouts
 */
export type GeoArrowGeometryInfo = {
  /** Geometry encodings that are compatible with this column (Field). */
  compatibleEncodings: GeoArrowEncoding[];
  /** Number of variable-length list levels before coordinates. */
  nesting: 0 | 1 | 2 | 3 | null;
  /** Number of values per coordinate. */
  dimension: number | null;
  /** Coordinate memory layout. */
  coordinates: 'separated' | 'interleaved' | null;
  /** Coordinate scalar type retained for compatibility with the legacy inspector. */
  valueType: 'double';
};

/**
 * Examines a GeoArrow field without reading array values.
 *
 * This compatibility projection delegates physical classification to
 * {@link inspectGeoArrowLayout}, the canonical layout oracle.
 *
 * @param field Arrow field to inspect.
 * @returns Legacy geometry information or null for an unrecognized layout.
 */
export function getGeoArrowGeometryInfo(field: arrow.Field): GeoArrowGeometryInfo | null {
  return getGeoArrowGeometryInfoFromLayout(field, inspectGeoArrowLayout(field));
}

/**
 * Projects a canonical layout inspection into the legacy geometry-info shape.
 *
 * @param field Arrow field represented by the inspection.
 * @param inspection Canonical GeoArrow layout inspection.
 * @returns Legacy geometry information or null for an unrecognized layout.
 */
export function getGeoArrowGeometryInfoFromLayout(
  field: arrow.Field,
  inspection: GeoArrowLayoutInspection
): GeoArrowGeometryInfo | null {
  const {layout} = inspection;
  if (inspection.issues.some(issue => issue.code !== 'missing-extension')) return null;
  const compatibleEncodings = getCompatibleEncodings(layout.kind, layout.encoding, field.type);
  if (compatibleEncodings.length === 0) return null;

  return {
    compatibleEncodings,
    nesting: getNesting(layout.kind, field.type),
    dimension: layout.dimension
      ? layout.dimension === 'xy'
        ? 2
        : layout.dimension === 'xyzm'
          ? 4
          : 3
      : layout.kind === 'wkb' || layout.kind === 'wkt'
        ? 2
        : null,
    coordinates:
      layout.coordinates || (layout.kind === 'wkb' || layout.kind === 'wkt' ? 'interleaved' : null),
    valueType: 'double'
  };
}

/** Resolves compatible legacy encodings from one canonical layout classification. */
function getCompatibleEncodings(
  kind: GeoArrowLayoutKind,
  encoding: GeoArrowEncoding | null,
  type: arrow.DataType
): GeoArrowEncoding[] {
  switch (kind) {
    case 'point':
      return ['geoarrow.point'];
    case 'linestring':
      return ['geoarrow.linestring'];
    case 'multipoint':
      return ['geoarrow.multipoint'];
    case 'polygon':
      return ['geoarrow.polygon'];
    case 'multilinestring':
      return ['geoarrow.multilinestring'];
    case 'multipolygon':
      return ['geoarrow.multipolygon'];
    case 'geometry-union':
      return ['geoarrow.geometry'];
    case 'geometrycollection':
      return ['geoarrow.geometrycollection'];
    case 'box':
      return ['geoarrow.box'];
    case 'wkb':
      return ['geoarrow.wkb'];
    case 'wkt':
      return ['geoarrow.wkt'];
    case 'list-geometry': {
      const depth = getListDepth(type);
      if (
        encoding &&
        ((depth === 1 &&
          (encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multipoint')) ||
          (depth === 2 &&
            (encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multilinestring')) ||
          (depth === 3 && encoding === 'geoarrow.multipolygon'))
      ) {
        return [encoding];
      }
      return depth === 1
        ? ['geoarrow.linestring', 'geoarrow.multipoint']
        : depth === 2
          ? ['geoarrow.polygon', 'geoarrow.multilinestring']
          : depth === 3
            ? ['geoarrow.multipolygon']
            : [];
    }
    default:
      return [];
  }
}

/** Returns the legacy nesting value for a canonical layout. */
function getNesting(kind: GeoArrowLayoutKind, type: arrow.DataType): 0 | 1 | 2 | 3 | null {
  if (kind === 'geometry-union') return null;
  if (kind === 'geometrycollection') return 1;
  const depth = getListDepth(type);
  return depth >= 0 && depth <= 3 ? (depth as 0 | 1 | 2 | 3) : null;
}

/** Counts list levels before a coordinate, struct, union, or scalar leaf. */
function getListDepth(type: arrow.DataType): number {
  let depth = 0;
  let currentType = type;
  while (currentType instanceof arrow.List || currentType instanceof arrow.LargeList) {
    depth++;
    currentType = currentType.children[0].type;
  }
  return depth;
}
