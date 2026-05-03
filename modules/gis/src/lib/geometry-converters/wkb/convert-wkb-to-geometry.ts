// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from '@loaders.gl/schema';
import type {WKBHeader} from './helpers/wkb-types';
import {WKBGeometryType} from './helpers/wkb-types';
import {parseWKBHeader} from './helpers/parse-wkb-header';

export type convertWKBOptions = {
  /** Does the GeoJSON input have Z values? */
  hasZ?: boolean;

  /** Does the GeoJSON input have M values? */
  hasM?: boolean;

  /** Spatial reference for input GeoJSON */
  srid?: any;
};

/**
 * Converts a WKB geometry into GeoJSON geometry.
 * @param arrayBuffer Binary WKB input
 * @returns Parsed GeoJSON geometry
 */
export function convertWKBToGeometry(arrayBuffer: ArrayBufferLike): Geometry {
  const dataView = new DataView(arrayBuffer);
  return parseWKBGeometry(dataView, 0).geometry;
}

type ParsedWKBGeometry = {
  geometry: Geometry;
  byteOffset: number;
};

/**
 * Parses a WKB geometry including its header from the provided byte offset.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the start of the geometry header
 * @returns Parsed GeoJSON geometry and the next unread byte offset
 */
function parseWKBGeometry(dataView: DataView, byteOffset: number): ParsedWKBGeometry {
  const wkbHeader = parseWKBHeader(dataView, {byteOffset} as WKBHeader);
  return parseWKBGeometryBody(dataView, wkbHeader.byteOffset, wkbHeader);
}

/**
 * Parses the body of a WKB geometry after its header.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the start of the geometry payload
 * @param wkbHeader Parsed WKB header
 * @returns Parsed GeoJSON geometry and the next unread byte offset
 */
function parseWKBGeometryBody(
  dataView: DataView,
  byteOffset: number,
  wkbHeader: {geometryType: number; dimensions: number; littleEndian: boolean}
): ParsedWKBGeometry {
  const {geometryType, dimensions, littleEndian} = wkbHeader;

  switch (geometryType) {
    case WKBGeometryType.Point:
      return parsePointGeometry(dataView, byteOffset, dimensions, littleEndian);
    case WKBGeometryType.LineString:
      return parseLineStringGeometry(dataView, byteOffset, dimensions, littleEndian);
    case WKBGeometryType.Polygon:
      return parsePolygonGeometry(dataView, byteOffset, dimensions, littleEndian);
    case WKBGeometryType.MultiPoint:
      return parseMultiPointGeometry(dataView, byteOffset, littleEndian);
    case WKBGeometryType.MultiLineString:
      return parseMultiLineStringGeometry(dataView, byteOffset, littleEndian);
    case WKBGeometryType.MultiPolygon:
      return parseMultiPolygonGeometry(dataView, byteOffset, littleEndian);
    case WKBGeometryType.GeometryCollection:
      return parseGeometryCollectionGeometry(dataView, byteOffset, littleEndian);
    default:
      throw new Error(`WKB: Unsupported geometry type: ${geometryType}`);
  }
}

/**
 * Parses a single coordinate position from WKB.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the first coordinate value
 * @param dimensions Number of coordinate values per position
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed coordinate and the next unread byte offset
 */
function parsePosition(
  dataView: DataView,
  byteOffset: number,
  dimensions: number,
  littleEndian: boolean
): {position: Position; byteOffset: number} {
  const position: number[] = [];

  for (let coordinateIndex = 0; coordinateIndex < dimensions; coordinateIndex++) {
    position.push(dataView.getFloat64(byteOffset, littleEndian));
    byteOffset += 8;
  }

  return {position, byteOffset};
}

/**
 * Parses a list of coordinate positions from WKB.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the point count
 * @param dimensions Number of coordinate values per position
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed coordinates and the next unread byte offset
 */
function parseCoordinateSequence(
  dataView: DataView,
  byteOffset: number,
  dimensions: number,
  littleEndian: boolean
): {coordinates: Position[]; byteOffset: number} {
  const pointCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: Position[] = [];
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const parsedPosition = parsePosition(dataView, byteOffset, dimensions, littleEndian);
    coordinates.push(parsedPosition.position);
    byteOffset = parsedPosition.byteOffset;
  }

  return {coordinates, byteOffset};
}

/**
 * Parses a WKB point geometry.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the point payload
 * @param dimensions Number of coordinate values per position
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed point geometry and the next unread byte offset
 */
function parsePointGeometry(
  dataView: DataView,
  byteOffset: number,
  dimensions: number,
  littleEndian: boolean
): {geometry: Point; byteOffset: number} {
  const parsedPosition = parsePosition(dataView, byteOffset, dimensions, littleEndian);
  return {
    geometry: {type: 'Point', coordinates: parsedPosition.position},
    byteOffset: parsedPosition.byteOffset
  };
}

/**
 * Parses a WKB linestring geometry.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the linestring payload
 * @param dimensions Number of coordinate values per position
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed linestring geometry and the next unread byte offset
 */
function parseLineStringGeometry(
  dataView: DataView,
  byteOffset: number,
  dimensions: number,
  littleEndian: boolean
): {geometry: LineString; byteOffset: number} {
  const parsedCoordinates = parseCoordinateSequence(dataView, byteOffset, dimensions, littleEndian);
  return {
    geometry: {type: 'LineString', coordinates: parsedCoordinates.coordinates},
    byteOffset: parsedCoordinates.byteOffset
  };
}

/**
 * Parses a WKB polygon geometry.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the polygon payload
 * @param dimensions Number of coordinate values per position
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed polygon geometry and the next unread byte offset
 */
function parsePolygonGeometry(
  dataView: DataView,
  byteOffset: number,
  dimensions: number,
  littleEndian: boolean
): {geometry: Polygon; byteOffset: number} {
  const ringCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: Position[][] = [];
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    const parsedRing = parseCoordinateSequence(dataView, byteOffset, dimensions, littleEndian);
    coordinates.push(parsedRing.coordinates);
    byteOffset = parsedRing.byteOffset;
  }

  return {
    geometry: {type: 'Polygon', coordinates},
    byteOffset
  };
}

/**
 * Parses a WKB multipoint geometry.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the multipoint payload
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed multipoint geometry and the next unread byte offset
 */
function parseMultiPointGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): {geometry: MultiPoint; byteOffset: number} {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: Position[] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometry(dataView, byteOffset);
    if (parsedGeometry.geometry.type !== 'Point') {
      throw new Error('WKB: Inner geometries of MultiPoint not of type Point');
    }
    coordinates.push(parsedGeometry.geometry.coordinates);
    byteOffset = parsedGeometry.byteOffset;
  }

  return {
    geometry: {type: 'MultiPoint', coordinates},
    byteOffset
  };
}

/**
 * Parses a WKB multilinestring geometry.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the multilinestring payload
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed multilinestring geometry and the next unread byte offset
 */
function parseMultiLineStringGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): {geometry: MultiLineString; byteOffset: number} {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: Position[][] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometry(dataView, byteOffset);
    if (parsedGeometry.geometry.type !== 'LineString') {
      throw new Error('WKB: Inner geometries of MultiLineString not of type LineString');
    }
    coordinates.push(parsedGeometry.geometry.coordinates);
    byteOffset = parsedGeometry.byteOffset;
  }

  return {
    geometry: {type: 'MultiLineString', coordinates},
    byteOffset
  };
}

/**
 * Parses a WKB multipolygon geometry.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the multipolygon payload
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed multipolygon geometry and the next unread byte offset
 */
function parseMultiPolygonGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): {geometry: MultiPolygon; byteOffset: number} {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: Position[][][] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometry(dataView, byteOffset);
    if (parsedGeometry.geometry.type !== 'Polygon') {
      throw new Error('WKB: Inner geometries of MultiPolygon not of type Polygon');
    }
    coordinates.push(parsedGeometry.geometry.coordinates);
    byteOffset = parsedGeometry.byteOffset;
  }

  return {
    geometry: {type: 'MultiPolygon', coordinates},
    byteOffset
  };
}

/**
 * Parses a WKB geometry collection.
 * @param dataView Binary WKB input view
 * @param byteOffset Offset to the geometry collection payload
 * @param littleEndian Whether values are encoded as little endian
 * @returns Parsed geometry collection and the next unread byte offset
 */
function parseGeometryCollectionGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): {geometry: GeometryCollection; byteOffset: number} {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const geometries: Geometry[] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometry(dataView, byteOffset);
    geometries.push(parsedGeometry.geometry);
    byteOffset = parsedGeometry.byteOffset;
  }

  return {
    geometry: {type: 'GeometryCollection', geometries},
    byteOffset
  };
}
