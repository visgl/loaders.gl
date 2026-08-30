// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * @note Conforms to the GeoArrow memory layout
 * @see https://geoarrow.org/format.html#memory-layouts
 * @note this is aligned with the geoarrow-js library (MIT license)
 * @see https://github.com/geoarrow/geoarrow-js/
 */

import type {
  Struct,
  Float,
  DataType,
  List,
  LargeList,
  FixedSizeList,
  Utf8,
  Binary
} from 'apache-arrow/type';

export type GeoArrowWKB = Binary;
export type GeoArrowWKT = Utf8;
/**
 * @note arrow.Float (not arrow.Float64) ensures that recreating a data instance with arrow.makeData type checks using the input's data type.
 */

/** Interleaved GeoArrow coordinates */
export type GeoArrowCoordInterleaved = FixedSizeList<Float>;
/** Separated GeoArrow coordinates */
export type GeoArrowCoordSeparated = Struct<Record<string, Float>>;

/** Arrow struct type for a GeoArrow axis-aligned bounding box. */
export type GeoArrowBoxType = Struct<Record<string, Float>>;

// Interleaved coords are the preferred case

export type GeoArrowCoord = GeoArrowCoordInterleaved;

/** GeoArrow variable-length list with either 32-bit or 64-bit offsets. */
export type GeoArrowList<T extends DataType = DataType> = List<T> | LargeList<T>;

/** Arrow type for GeoArrow geometry */
export type GeoArrowPoint = GeoArrowCoordInterleaved;
/** Arrow type for GeoArrow geometry */
export type GeoArrowLineString = GeoArrowList<GeoArrowCoordInterleaved>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowPolygon = GeoArrowList<GeoArrowList<GeoArrowCoordInterleaved>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPoint = GeoArrowList<GeoArrowCoordInterleaved>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiLineString = GeoArrowList<GeoArrowList<GeoArrowCoordInterleaved>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPolygon = GeoArrowList<
  GeoArrowList<GeoArrowList<GeoArrowCoordInterleaved>>
>;

/** Arrow type for GeoArrow geometry */
export type GeoArrowGeometry =
  | GeoArrowPoint
  | GeoArrowLineString
  | GeoArrowPolygon
  | GeoArrowMultiPoint
  | GeoArrowMultiLineString
  | GeoArrowMultiPolygon;

// Separated coordinates are supported for all native geometry nesting levels.
/** Arrow type for GeoArrow geometry */
export type GeoArrowPointSeparated = GeoArrowCoordSeparated;
/** Arrow type for GeoArrow geometry */
export type GeoArrowLineStringSeparated = GeoArrowList<GeoArrowCoordSeparated>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowPolygonSeparated = GeoArrowList<GeoArrowList<GeoArrowCoordSeparated>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPointSeparated = GeoArrowList<GeoArrowCoordSeparated>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiLineStringSeparated = GeoArrowList<GeoArrowList<GeoArrowCoordSeparated>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPolygonSeparated = GeoArrowList<
  GeoArrowList<GeoArrowList<GeoArrowCoordSeparated>>
>;

/** Arrow type for GeoArrow geometry */
export type GeoArrowGeometrySeparated =
  | GeoArrowPointSeparated
  | GeoArrowLineStringSeparated
  | GeoArrowPolygonSeparated
  | GeoArrowMultiPointSeparated
  | GeoArrowMultiLineStringSeparated
  | GeoArrowMultiPolygonSeparated;
