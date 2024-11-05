// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * @note Conforms to the GeoArrow memory layout
 * @see https://geoarrow.org/format.html#memory-layouts
 * @note this is aligned with the geoarrow-js library (MIT license)
 * @see https://github.com/geoarrow/geoarrow-js/
 */

import type {Struct, Float, List, FixedSizeList, Utf8, Binary} from 'apache-arrow/type';

export type GeoArrowWKB = Binary;
export type GeoArrowWKT = Utf8;
/**
 * @note arrow.Float (not arrow.Float64) ensures that recreating a data instance with arrow.makeData type checks using the input's data type.
 */

/** Interleaved GeoArrow coordinates */
export type GeoArrowCoordInterleaved = FixedSizeList<Float>;
/** Separated GeoArrow coordinates */
export type GeoArrowCoordSeparated = Struct<{x: Float; y: Float}>;

// Interleaved coords are the preferred case

export type GeoArrowCoord = GeoArrowCoordInterleaved;

/** Arrow type for GeoArrow geometry */
export type GeoArrowPoint = GeoArrowCoordInterleaved;
/** Arrow type for GeoArrow geometry */
export type GeoArrowLineString = List<GeoArrowCoordInterleaved>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowPolygon = List<List<GeoArrowCoordInterleaved>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPoint = List<GeoArrowCoordInterleaved>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiLineString = List<List<GeoArrowCoordInterleaved>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPolygon = List<List<List<GeoArrowCoordInterleaved>>>;

/** Arrow type for GeoArrow geometry */
export type GeoArrowGeometry =
  | GeoArrowPoint
  | GeoArrowLineString
  | GeoArrowPolygon
  | GeoArrowMultiPoint
  | GeoArrowMultiLineString
  | GeoArrowMultiPolygon;

// Separated coords - not yet well supported
/** Arrow type for GeoArrow geometry */
export type GeoArrowPointSeparated = GeoArrowCoordSeparated;
/** Arrow type for GeoArrow geometry */
export type GeoArrowLineStringSeparated = List<GeoArrowCoordSeparated>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowPolygonSeparated = List<List<GeoArrowCoordSeparated>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPointSeparated = List<GeoArrowCoordSeparated>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiLineStringSeparated = List<List<GeoArrowCoordSeparated>>;
/** Arrow type for GeoArrow geometry */
export type GeoArrowMultiPolygonSeparated = List<List<List<GeoArrowCoordSeparated>>>;

/** Arrow type for GeoArrow geometry */
export type GeoArrowGeometrySeparated =
  | GeoArrowPointSeparated
  | GeoArrowLineStringSeparated
  | GeoArrowPolygonSeparated
  | GeoArrowMultiPointSeparated
  | GeoArrowMultiLineStringSeparated
  | GeoArrowMultiPolygonSeparated;
