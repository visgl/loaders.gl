// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Integer codes for geometry types in WKB and related formats
 * @see: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 */
export enum WKBGeometryType {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7
}

/** Parsed WKB header */
export type WKBHeader = {
  /** WKB or TWKB */
  type: 'wkb' | 'twkb';
  /** WKB variant */
  variant: 'wkb' | 'ewkb' | 'iso-wkb' | 'twkb';
  /** geometry type encoded in this WKB: point, line, polygon etc */
  geometryType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Number of dimensions for coordinate data */
  dimensions: 2 | 3 | 4;
  /** Coordinate names, Z and M are controlled by flags */
  coordinates: 'xy' | 'xyz' | 'xym' | 'xyzm';
  /** WKB Geometry has a spatial coordinate reference system id */
  srid?: number;
  /** true if binary data is stored as little endian */
  littleEndian: boolean;
  /** Offset to start of geometry */
  byteOffset: number;
};

/**
 * Options for writing WKB
 */
export type WKBOptions = {
  /** Does the GeoJSON input have Z values? */
  hasZ?: boolean;
  /** Does the GeoJSON input have M values? */
  hasM?: boolean;
  /** Spatial reference for input GeoJSON */
  srid?: any;
};

/** WKB Geometry has a z coordinate */
export const EWKB_FLAG_Z = 0x80000000;
/** WKB Geometry has an m coordinate */
export const EWKB_FLAG_M = 0x40000000;
/** WKB Geometry has a spatial coordinate reference system id */
export const EWKB_FLAG_SRID = 0x20000000;
/** @todo: Assume no more than 10K SRIDs are defined */
export const MAX_SRID = 10000;

/**
 * @see: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 * @note Order matches WKBGeometryType enum (need to add 1)
 * @note: We only support this "geojson" subset of the OGC simple features standard
 */
export const WKT_MAGIC_STRINGS = [
  'POINT(',
  'LINESTRING(',
  'POLYGON(',
  'MULTIPOINT(',
  'MULTILINESTRING(',
  'MULTIPOLYGON(',
  'GEOMETRYCOLLECTION('
];

const textEncoder = new TextEncoder();

/**
 * @see: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 * @note Order matches WKBGeometryType enum (need to add 1)
 * @note: We only support this "geojson" subset of the OGC simple features standard
 */
export const WKT_MAGIC_BYTES = WKT_MAGIC_STRINGS.map((string) => textEncoder.encode(string));
