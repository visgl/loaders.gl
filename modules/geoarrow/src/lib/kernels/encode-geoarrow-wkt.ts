// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowDimension, GeoArrowEncoding} from '@loaders.gl/schema';
import {getGeoArrowUnionDimension, getGeoArrowUnionGeometryKind} from './geoarrow-union';

type GeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/**
 * Writes native GeoArrow values directly to WKT strings.
 *
 * The encoder traverses native Arrow scalar and union values without constructing GeoJSON
 * geometry objects. A `null` result means the source layout is not a supported native geometry
 * layout, allowing the caller to use its compatibility path.
 *
 * @param column Native GeoArrow vector.
 * @param sourceEncoding Source GeoArrow encoding.
 * @param dimension Optional semantic coordinate dimension.
 * @returns WKT Arrow vector, or `null` for unsupported source layouts.
 */
export function encodeGeoArrowWKTVector(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension
): arrow.Vector | null {
  if (!isNativeGeometryEncoding(sourceEncoding)) return null;

  const values: (string | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      values.push(null);
      continue;
    }
    const geometryKind = getRowGeometryKind(column, rowIndex, sourceEncoding);
    const rowDimension =
      dimension ||
      (sourceEncoding === 'geoarrow.geometrycollection'
        ? inferCollectionDimension(value)
        : inferDimensionFromTypeId(column, rowIndex, sourceEncoding));
    const wkt = encodeNativeValue(value, geometryKind, rowDimension, !dimension);
    if (wkt === null) return null;
    values.push(wkt);
  }
  return arrow.vectorFromArray(values, new arrow.Utf8());
}

/** Returns whether an encoding contains native geometry values that WKT can represent. */
function isNativeGeometryEncoding(encoding: GeoArrowEncoding): boolean {
  return (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.multipolygon' ||
    encoding === 'geoarrow.geometry' ||
    encoding === 'geoarrow.geometrycollection'
  );
}

/** Converts one native scalar to a WKT value using its declared family. */
function encodeNativeValue(
  value: unknown,
  geometryKind: GeometryKind,
  dimension: GeoArrowDimension,
  preserveMemberDimensions = false
): string | null {
  switch (geometryKind) {
    case 'Point':
      return encodePoint(value, dimension);
    case 'LineString':
      return encodeLineString(value, dimension);
    case 'Polygon':
      return encodePolygon(value, dimension);
    case 'MultiPoint':
      return encodeMultiPoint(value, dimension);
    case 'MultiLineString':
      return encodeMultiLineString(value, dimension);
    case 'MultiPolygon':
      return encodeMultiPolygon(value, dimension);
    case 'GeometryCollection':
      return encodeGeometryCollection(value, dimension, preserveMemberDimensions);
    default:
      return null;
  }
}

/** Encodes a Point scalar or empty point. */
function encodePoint(value: unknown, dimension: GeoArrowDimension): string | null {
  const coordinate = readCoordinate(value);
  return coordinate
    ? `POINT${getDimensionSuffix(dimension)} (${encodeCoordinate(coordinate)})`
    : 'POINT EMPTY';
}

/** Encodes a LineString list. */
function encodeLineString(value: unknown, dimension: GeoArrowDimension): string | null {
  const coordinates = readChildren(value);
  if (!coordinates) return null;
  const encodedCoordinates = encodeCoordinateSequence(coordinates);
  if (encodedCoordinates === null) return null;
  return coordinates.length === 0
    ? `LINESTRING${getDimensionSuffix(dimension)} EMPTY`
    : `LINESTRING${getDimensionSuffix(dimension)} (${encodedCoordinates})`;
}

/** Encodes a Polygon list of rings. */
function encodePolygon(value: unknown, dimension: GeoArrowDimension): string | null {
  const rings = readChildren(value);
  if (!rings) return null;
  if (rings.length === 0) return `POLYGON${getDimensionSuffix(dimension)} EMPTY`;
  const encodedRings = rings.map(ring => encodeCoordinateSequenceValue(ring));
  if (encodedRings.some(encodedRing => encodedRing === null)) return null;
  return `POLYGON${getDimensionSuffix(dimension)} (${encodedRings.join(', ')})`;
}

/** Encodes a MultiPoint list. */
function encodeMultiPoint(value: unknown, dimension: GeoArrowDimension): string | null {
  const points = readChildren(value);
  if (!points) return null;
  if (points.length === 0) return `MULTIPOINT${getDimensionSuffix(dimension)} EMPTY`;
  const encodedPoints = points.map(point => {
    const coordinate = readCoordinate(point);
    return coordinate ? `(${encodeCoordinate(coordinate)})` : null;
  });
  if (encodedPoints.some(encodedPoint => encodedPoint === null)) return null;
  return `MULTIPOINT${getDimensionSuffix(dimension)} (${encodedPoints.join(', ')})`;
}

/** Encodes a MultiLineString list of lines. */
function encodeMultiLineString(value: unknown, dimension: GeoArrowDimension): string | null {
  const lines = readChildren(value);
  if (!lines) return null;
  if (lines.length === 0) return `MULTILINESTRING${getDimensionSuffix(dimension)} EMPTY`;
  const encodedLines = lines.map(line => encodeCoordinateSequenceValue(line));
  if (encodedLines.some(encodedLine => encodedLine === null)) return null;
  return `MULTILINESTRING${getDimensionSuffix(dimension)} (${encodedLines.join(', ')})`;
}

/** Encodes a MultiPolygon list of polygons. */
function encodeMultiPolygon(value: unknown, dimension: GeoArrowDimension): string | null {
  const polygons = readChildren(value);
  if (!polygons) return null;
  if (polygons.length === 0) return `MULTIPOLYGON${getDimensionSuffix(dimension)} EMPTY`;
  const encodedPolygons = polygons.map(polygon => {
    const rings = readChildren(polygon);
    if (!rings) return null;
    const encodedRings = rings.map(ring => encodeCoordinateSequenceValue(ring));
    return encodedRings.some(encodedRing => encodedRing === null)
      ? null
      : `(${encodedRings.join(', ')})`;
  });
  if (encodedPolygons.some(encodedPolygon => encodedPolygon === null)) return null;
  return `MULTIPOLYGON${getDimensionSuffix(dimension)} (${encodedPolygons.join(', ')})`;
}

/** Encodes a GeometryCollection dense union recursively. */
function encodeGeometryCollection(
  value: unknown,
  dimension: GeoArrowDimension,
  preserveMemberDimensions: boolean
): string | null {
  if (!isVectorLike(value)) return null;
  const geometries: string[] = [];
  for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
    const unionVector = value as arrow.Vector;
    const typeId = getUnionTypeId(unionVector, rowIndex);
    const childField = getUnionField(unionVector, rowIndex);
    const geometryKind = getGeoArrowUnionGeometryKind(
      childField?.name,
      typeId
    ) as GeometryKind | null;
    const childDimension = getGeoArrowUnionDimension(childField?.name, childField?.type, typeId);
    if (!geometryKind || !childDimension) return null;
    const geometry = encodeNativeValue(
      unionVector.get(rowIndex),
      geometryKind,
      preserveMemberDimensions ? childDimension : dimension,
      preserveMemberDimensions
    );
    if (geometry === null) return null;
    geometries.push(geometry);
  }
  return geometries.length === 0
    ? 'GEOMETRYCOLLECTION EMPTY'
    : `GEOMETRYCOLLECTION (${geometries.join(', ')})`;
}

/** Encodes one coordinate sequence from a native list scalar. */
function encodeCoordinateSequenceValue(value: unknown): string | null {
  const coordinates = readChildren(value);
  if (!coordinates) return null;
  const encodedCoordinates = encodeCoordinateSequence(coordinates);
  return encodedCoordinates === null ? null : `(${encodedCoordinates})`;
}

/** Encodes coordinate children without changing their semantic axis order. */
function encodeCoordinateSequence(values: readonly unknown[]): string | null {
  const coordinates = values.map(value => {
    const coordinate = readCoordinate(value);
    return coordinate ? encodeCoordinate(coordinate) : null;
  });
  return coordinates.every(coordinate => coordinate !== null) ? coordinates.join(', ') : null;
}

/** Serializes one coordinate tuple. */
function encodeCoordinate(coordinate: readonly number[]): string {
  return coordinate.map(value => String(value)).join(' ');
}

/** Reads one interleaved or separated native coordinate scalar. */
function readCoordinate(value: unknown): number[] | null {
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const record = value as {x: unknown; y: unknown; z?: unknown; m?: unknown};
    const coordinate = [Number(record.x), Number(record.y)];
    if (typeof record.z === 'number') coordinate.push(record.z);
    if (typeof record.m === 'number') coordinate.push(record.m);
    return coordinate.every(Number.isFinite) ? coordinate : null;
  }
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    return readCoordinate((value as {toArray(): ArrayLike<unknown>}).toArray());
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    const coordinate = Array.from(value as ArrayLike<unknown>, Number);
    return coordinate.length >= 2 && coordinate.every(Number.isFinite) ? coordinate : null;
  }
  return null;
}

/** Reads children from Arrow vectors, arrays, and typed-array list scalars. */
function readChildren(value: unknown): unknown[] | null {
  if (isVectorLike(value)) {
    const children: unknown[] = [];
    for (let index = 0; index < value.length; index++) children.push(value.get(index));
    return children;
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return Array.from(value as ArrayLike<unknown>);
  }
  return null;
}

/** Returns a dense union type ID for one logical row, including sliced data. */
function getUnionTypeId(vector: arrow.Vector, rowIndex: number): number {
  let remainingRowIndex = rowIndex;
  for (const data of vector.data) {
    if (remainingRowIndex >= data.length) {
      remainingRowIndex -= data.length;
      continue;
    }
    const typeIdIndex =
      data.typeIds.length <= data.length ? remainingRowIndex : data.offset + remainingRowIndex;
    return data.typeIds[typeIdIndex];
  }
  throw new Error(`Dense union row ${rowIndex} is out of bounds.`);
}

/** Returns the semantic field for a dense-union row, including sliced vectors. */
function getUnionField(vector: arrow.Vector, rowIndex: number): arrow.Field | undefined {
  const unionType = vector.type;
  if (!(unionType instanceof arrow.DenseUnion)) return undefined;
  const typeId = getUnionTypeId(vector, rowIndex);
  const childIndex = unionType.typeIds.indexOf(typeId);
  return childIndex >= 0 ? unionType.children[childIndex] : undefined;
}

/** Maps a standard GeoArrow union type ID to its geometry family. */
/** Infers row dimension from a union ID or native physical type. */
function inferDimensionFromTypeId(
  column: arrow.Vector,
  rowIndex: number,
  sourceEncoding: GeoArrowEncoding
): GeoArrowDimension {
  if (sourceEncoding === 'geoarrow.geometry') {
    const typeId = getUnionTypeId(column, rowIndex);
    const field = getUnionField(column, rowIndex);
    return getGeoArrowUnionDimension(field?.name, field?.type, typeId) || 'xy';
  }
  let type = column.type;
  while (type instanceof arrow.List || type instanceof arrow.LargeList) {
    type = type.children[0].type;
  }
  if (type instanceof arrow.Struct) {
    const names = new Set(type.children.map(field => field.name));
    if (names.has('z') && names.has('m')) return 'xyzm';
    if (names.has('m')) return 'xym';
    if (names.has('z')) return 'xyz';
  }
  if (type instanceof arrow.FixedSizeList) {
    return type.listSize === 4 ? 'xyzm' : type.listSize === 3 ? 'xyz' : 'xy';
  }
  return 'xy';
}

/** Returns the geometry family for a logical native row. */
function getRowGeometryKind(
  column: arrow.Vector,
  rowIndex: number,
  sourceEncoding: GeoArrowEncoding
): GeometryKind {
  if (sourceEncoding === 'geoarrow.geometry') {
    const typeId = getUnionTypeId(column, rowIndex);
    const field = getUnionField(column, rowIndex);
    return (getGeoArrowUnionGeometryKind(field?.name, typeId) ||
      'GeometryCollection') as GeometryKind;
  }
  if (sourceEncoding === 'geoarrow.geometrycollection') return 'GeometryCollection';
  return getGeometryKind(sourceEncoding);
}

/** Infers a collection dimension from its first dense-union member. */
function inferCollectionDimension(value: unknown): GeoArrowDimension {
  if (!isVectorLike(value)) return 'xy';
  const vector = value as arrow.Vector;
  if (vector.length > 0) {
    const typeId = getUnionTypeId(vector, 0);
    const field = getUnionField(vector, 0);
    return getGeoArrowUnionDimension(field?.name, field?.type, typeId) || 'xy';
  }
  return 'xy';
}

/** Returns the geometry family represented by a concrete native encoding. */
function getGeometryKind(encoding: GeoArrowEncoding): GeometryKind {
  switch (encoding) {
    case 'geoarrow.point':
      return 'Point';
    case 'geoarrow.linestring':
      return 'LineString';
    case 'geoarrow.polygon':
      return 'Polygon';
    case 'geoarrow.multipoint':
      return 'MultiPoint';
    case 'geoarrow.multilinestring':
      return 'MultiLineString';
    case 'geoarrow.multipolygon':
      return 'MultiPolygon';
    case 'geoarrow.geometry':
      return 'GeometryCollection';
    case 'geoarrow.geometrycollection':
      return 'GeometryCollection';
    default:
      throw new Error(`Unsupported native WKT encoding "${encoding}".`);
  }
}

/** Returns the WKT dimensionality suffix. */
function getDimensionSuffix(dimension: GeoArrowDimension): string {
  return dimension === 'xy'
    ? ''
    : dimension === 'xyzm'
      ? ' ZM'
      : ` ${dimension.slice(2).toUpperCase()}`;
}

/** Tests Arrow vectors and nested list scalars. */
function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}
