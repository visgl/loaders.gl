// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Numeric WKB geometry types accepted by the compatibility builder API. */
export enum WKBGeometryType {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7
}

/** EWKB flag indicating that coordinates include a Z ordinate. */
export const EWKB_FLAG_Z = 0x80000000;
/** EWKB flag indicating that coordinates include an M ordinate. */
export const EWKB_FLAG_M = 0x40000000;
/** EWKB flag indicating that the header includes an SRID. */
export const EWKB_FLAG_SRID = 0x20000000;
