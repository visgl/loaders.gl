// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowOffsetType,
  GeoParquetGeometryType
} from '@loaders.gl/schema';

/** All GeoArrow extension encodings recognized by the loaders.gl contract. */
export const GEOARROW_ENCODINGS = [
  'geoarrow.geometry',
  'geoarrow.geometrycollection',
  'geoarrow.multipolygon',
  'geoarrow.polygon',
  'geoarrow.multilinestring',
  'geoarrow.linestring',
  'geoarrow.multipoint',
  'geoarrow.point',
  'geoarrow.box',
  'geoarrow.wkb',
  'geoarrow.wkt'
] as const satisfies readonly GeoArrowEncoding[];

/** Coordinate dimensions exercised by the GeoArrow conformance contract. */
export const GEOARROW_DIMENSIONS = [
  'xy',
  'xyz',
  'xym',
  'xyzm'
] as const satisfies readonly GeoArrowDimension[];

/** Native coordinate layouts exercised by the GeoArrow conformance contract. */
export const GEOARROW_COORDINATE_LAYOUTS = [
  'interleaved',
  'separated'
] as const satisfies readonly GeoArrowCoordinateLayout[];

/** Variable-length offset widths exercised by the GeoArrow conformance contract. */
export const GEOARROW_OFFSET_TYPES = [
  'int32',
  'int64'
] as const satisfies readonly GeoArrowOffsetType[];

/** Row states exercised by the GeoArrow conformance laboratory. */
export const GEOARROW_ROW_STATES = ['valid', 'null', 'empty', 'chunked', 'malformed'] as const;

/** Physical child-name variants exercised by the GeoArrow conformance laboratory. */
export const GEOARROW_CHILD_NAME_VARIANTS = ['canonical', 'legal'] as const;

/** One row-state variant in the GeoArrow conformance laboratory. */
export type GeoArrowConformanceRowState = (typeof GEOARROW_ROW_STATES)[number];

/** One legal physical child-name variant in the GeoArrow conformance laboratory. */
export type GeoArrowConformanceChildNameVariant = (typeof GEOARROW_CHILD_NAME_VARIANTS)[number];

/** Geometry families represented by the complete GeoArrow matrix. */
export const GEOARROW_GEOMETRY_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
] as const satisfies readonly GeoParquetGeometryType[];

/** One independently addressable row in the GeoArrow conformance ledger. */
export type GeoArrowConformanceCase = Readonly<{
  /** Stable identifier suitable for fixture names and test titles. */
  id: string;
  /** GeoArrow extension encoding under test. */
  encoding: GeoArrowEncoding;
  /** Geometry family represented by the fixture, when applicable. */
  geometryType?: GeoParquetGeometryType;
  /** Coordinate dimension under test. */
  dimension: GeoArrowDimension;
  /** Coordinate layout under test. */
  coordinates: GeoArrowCoordinateLayout;
  /** Variable-length offset width under test. */
  offsetType: GeoArrowOffsetType;
  /** Null, empty, chunked, or malformed row state under test. */
  rowState: GeoArrowConformanceRowState;
  /** Canonical or legal alternate child names under test. */
  childNameVariant: GeoArrowConformanceChildNameVariant;
}>;

let geoArrowConformanceMatrix: readonly GeoArrowConformanceCase[] | undefined;

/**
 * Returns the deterministic conformance matrix used by tests, benchmarks, and documentation.
 *
 * The matrix deliberately includes physical combinations that are irrelevant to scalar WKB/WKT
 * values. Those rows still matter: a producer may choose a native target after inspecting a
 * serialized source, and the contract must make the requested physical representation explicit.
 *
 * @returns Immutable conformance cases in stable order.
 */
export function getGeoArrowConformanceMatrix(): readonly GeoArrowConformanceCase[] {
  geoArrowConformanceMatrix ||= Object.freeze(
    createGeoArrowConformanceMatrix().map(testCase => Object.freeze(testCase))
  );
  return geoArrowConformanceMatrix;
}

/** Builds the deterministic matrix on first use. */
function createGeoArrowConformanceMatrix(): GeoArrowConformanceCase[] {
  const cases: GeoArrowConformanceCase[] = [];
  for (const encoding of GEOARROW_ENCODINGS) {
    const geometryTypes = getGeometryTypesForEncoding(encoding);
    for (const geometryType of geometryTypes) {
      for (const dimension of GEOARROW_DIMENSIONS) {
        for (const coordinates of GEOARROW_COORDINATE_LAYOUTS) {
          for (const offsetType of GEOARROW_OFFSET_TYPES) {
            for (const rowState of GEOARROW_ROW_STATES) {
              for (const childNameVariant of GEOARROW_CHILD_NAME_VARIANTS) {
                cases.push({
                  id: [
                    encoding.replace('geoarrow.', ''),
                    geometryType,
                    dimension,
                    coordinates,
                    offsetType,
                    rowState,
                    childNameVariant
                  ]
                    .filter(Boolean)
                    .join('-'),
                  encoding,
                  geometryType,
                  dimension,
                  coordinates,
                  offsetType,
                  rowState,
                  childNameVariant
                });
              }
            }
          }
        }
      }
    }
  }
  return cases;
}

/** Returns the matrix rows that are meaningful for one extension encoding. */
function getGeometryTypesForEncoding(
  encoding: GeoArrowEncoding
): readonly GeoParquetGeometryType[] {
  switch (encoding) {
    case 'geoarrow.point':
      return ['Point'];
    case 'geoarrow.linestring':
      return ['LineString'];
    case 'geoarrow.polygon':
      return ['Polygon'];
    case 'geoarrow.multipoint':
      return ['MultiPoint'];
    case 'geoarrow.multilinestring':
      return ['MultiLineString'];
    case 'geoarrow.multipolygon':
      return ['MultiPolygon'];
    case 'geoarrow.geometrycollection':
      return ['GeometryCollection'];
    case 'geoarrow.geometry':
      return GEOARROW_GEOMETRY_TYPES;
    case 'geoarrow.box':
      return ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    case 'geoarrow.wkb':
    case 'geoarrow.wkt':
      return GEOARROW_GEOMETRY_TYPES;
  }
}
