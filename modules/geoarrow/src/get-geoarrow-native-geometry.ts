// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from '@loaders.gl/schema';
import {
  getGeoArrowUnionGeometryKind,
  type GeoArrowUnionGeometryKind
} from './lib/kernels/geoarrow-union';

/** Native geometry value containing coordinate arrays without GeoJSON properties. */
export type GeoArrowNativeGeometry =
  | {type: 'Point'; coordinates: number[]}
  | {type: 'MultiPoint'; coordinates: number[][]}
  | {type: 'LineString'; coordinates: number[][]}
  | {type: 'MultiLineString'; coordinates: number[][][]}
  | {type: 'Polygon'; coordinates: number[][][]}
  | {type: 'MultiPolygon'; coordinates: number[][][][]}
  | {type: 'GeometryCollection'; geometries: GeoArrowNativeGeometry[]};

type NativeEncoding = Exclude<
  GeoArrowEncoding,
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.box'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt'
>;
type NativeCoordinates = number[] | NativeCoordinates[];

/**
 * Reads one native GeoArrow row into a geometry-family tagged coordinate value.
 *
 * The result omits GeoJSON properties and preserves native coordinate nesting, allowing Scan to
 * execute common residual predicates without creating GeoJSON geometry objects. Dense unions and
 * nested GeometryCollections are decoded recursively.
 *
 * @param column Native GeoArrow vector.
 * @param rowIndex Logical row index.
 * @param encoding Declared GeoArrow encoding.
 * @param maximumDepth Maximum nested GeometryCollection depth.
 * @returns Native geometry or `null` for a null/unsupported row.
 */
export function getGeoArrowNativeGeometry(
  column: arrow.Vector,
  rowIndex: number,
  encoding: GeoArrowEncoding,
  maximumDepth = 64
): GeoArrowNativeGeometry | null {
  if (rowIndex < 0 || rowIndex >= column.length || encoding === 'geoarrow.box') return null;
  if (encoding === 'geoarrow.geometry') {
    const unionCell = getUnionCell(column, rowIndex);
    return unionCell ? readUnionGeometry(unionCell, maximumDepth, 0) : null;
  }
  if (encoding === 'geoarrow.geometrycollection') {
    const value = column.get(rowIndex);
    return value == null
      ? null
      : {type: 'GeometryCollection', geometries: readCollectionVector(value, maximumDepth, 0)};
  }
  if (!isNativeEncoding(encoding)) return null;
  const coordinates = readNativeCoordinates(column.get(rowIndex), getEncodingDepth(encoding));
  return coordinates ? makeConcreteGeometry(encoding, coordinates) : null;
}

/** Converts one concrete native encoding and coordinate nesting to a tagged geometry value. */
function makeConcreteGeometry(
  encoding: NativeEncoding,
  coordinates: NativeCoordinates
): GeoArrowNativeGeometry {
  switch (encoding) {
    case 'geoarrow.point':
      return {type: 'Point', coordinates: coordinates as number[]};
    case 'geoarrow.multipoint':
      return {type: 'MultiPoint', coordinates: coordinates as number[][]};
    case 'geoarrow.linestring':
      return {type: 'LineString', coordinates: coordinates as number[][]};
    case 'geoarrow.multilinestring':
      return {type: 'MultiLineString', coordinates: coordinates as number[][][]};
    case 'geoarrow.polygon':
      return {type: 'Polygon', coordinates: coordinates as number[][][]};
    case 'geoarrow.multipolygon':
      return {type: 'MultiPolygon', coordinates: coordinates as number[][][][]};
  }
}

/** Reads an Arrow native value recursively at the encoding's list depth. */
function readNativeCoordinates(value: unknown, depth: number): NativeCoordinates | null {
  if (value == null) return null;
  if (depth === 0) return readCoordinate(value);
  const children = readChildren(value);
  if (!children) return null;
  const coordinates: NativeCoordinates[] = [];
  for (const child of children) {
    const parsed = readNativeCoordinates(child, depth - 1);
    if (!parsed) return null;
    coordinates.push(parsed);
  }
  return coordinates;
}

/** Reads interleaved or separated coordinate values by position. */
function readCoordinate(value: unknown): number[] | null {
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const coordinate = value as {x: unknown; y: unknown; z?: unknown; m?: unknown};
    const values = [coordinate.x, coordinate.y];
    if (typeof coordinate.z === 'number') values.push(coordinate.z);
    if (typeof coordinate.m === 'number') values.push(coordinate.m);
    return values.every(item => typeof item === 'number') ? (values as number[]) : null;
  }
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    return readCoordinate((value as {toArray(): ArrayLike<unknown>}).toArray());
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    const values = Array.from(value as ArrayLike<unknown>);
    return values.every(item => typeof item === 'number') ? (values as number[]) : null;
  }
  return null;
}

/** Reads list children from Arrow values and vectors. */
function readChildren(value: unknown): unknown[] | null {
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    return Array.from((value as {toArray(): ArrayLike<unknown>}).toArray());
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return Array.from(value as ArrayLike<unknown>);
  }
  if (isVectorLike(value)) {
    const children: unknown[] = [];
    for (let index = 0; index < value.length; index++) children.push(value.get(index));
    return children;
  }
  return null;
}

/** Resolves a dense-union cell from full or sliced Arrow buffers. */
function getUnionCell(
  column: arrow.Vector,
  rowIndex: number
): {
  childName: string;
  typeId: number;
  value: unknown;
} | null {
  const unionType = column.type;
  if (!(unionType instanceof arrow.DenseUnion)) return null;
  let remainingRowIndex = rowIndex;
  for (const chunk of column.data) {
    if (remainingRowIndex >= chunk.length) {
      remainingRowIndex -= chunk.length;
      continue;
    }
    const bufferIndex =
      chunk.typeIds.length <= chunk.length ? remainingRowIndex : chunk.offset + remainingRowIndex;
    const typeId = chunk.typeIds?.[bufferIndex];
    const valueOffset = chunk.valueOffsets?.[bufferIndex];
    const childIndex = unionType.typeIds.indexOf(typeId);
    const child = childIndex >= 0 ? chunk.children[childIndex] : undefined;
    const childField = childIndex >= 0 ? unionType.children[childIndex] : undefined;
    if (
      !child ||
      !childField ||
      valueOffset === undefined ||
      valueOffset < 0 ||
      valueOffset >= child.length
    ) {
      return null;
    }
    const childVector = arrow.makeVector(child);
    return {
      childName: childField.name,
      typeId,
      value: childVector.get(valueOffset)
    };
  }
  return null;
}

/** Reads one union cell, including GeometryCollection children. */
function readUnionGeometry(
  cell: {childName: string; typeId: number; value: unknown},
  maximumDepth: number,
  depth: number
): GeoArrowNativeGeometry | null {
  const unionGeometry = getGeoArrowUnionGeometryKind(cell.childName, cell.typeId);
  if (unionGeometry === 'GeometryCollection') {
    if (depth >= maximumDepth) {
      throw new Error(
        `GeometryCollection nesting exceeds maxGeometryCollectionDepth (${maximumDepth}).`
      );
    }
    return {
      type: 'GeometryCollection',
      geometries: readCollectionVector(cell.value, maximumDepth, depth + 1)
    };
  }
  const encoding = getEncodingForUnionGeometry(unionGeometry);
  if (!encoding) return null;
  const coordinates = readNativeCoordinates(cell.value, getEncodingDepth(encoding));
  return coordinates ? makeConcreteGeometry(encoding, coordinates) : null;
}

/** Maps a resolved union family to its native encoding. */
function getEncodingForUnionGeometry(
  geometryFamily: Exclude<GeoArrowUnionGeometryKind, 'GeometryCollection'> | null
): NativeEncoding | null {
  switch (geometryFamily) {
    case 'Point':
      return 'geoarrow.point';
    case 'LineString':
      return 'geoarrow.linestring';
    case 'Polygon':
      return 'geoarrow.polygon';
    case 'MultiPoint':
      return 'geoarrow.multipoint';
    case 'MultiLineString':
      return 'geoarrow.multilinestring';
    case 'MultiPolygon':
      return 'geoarrow.multipolygon';
    default:
      return null;
  }
}

/** Reads all members of a GeometryCollection union vector. */
function readCollectionVector(
  value: unknown,
  maximumDepth: number,
  depth: number
): GeoArrowNativeGeometry[] {
  if (!isVectorLike(value)) return [];
  const geometries: GeoArrowNativeGeometry[] = [];
  for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
    const cell = getUnionCell(value as arrow.Vector, rowIndex);
    if (!cell) continue;
    const geometry = readUnionGeometry(cell, maximumDepth, depth);
    if (geometry) geometries.push(geometry);
  }
  return geometries;
}

/** Resolves native nesting depth from a concrete encoding. */
function getEncodingDepth(encoding: NativeEncoding): 0 | 1 | 2 | 3 {
  switch (encoding) {
    case 'geoarrow.point':
      return 0;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      return 1;
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring':
      return 2;
    case 'geoarrow.multipolygon':
      return 3;
  }
}

/** Checks whether an encoding is a concrete native geometry encoding. */
function isNativeEncoding(encoding: GeoArrowEncoding): encoding is NativeEncoding {
  return (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.multipolygon'
  );
}

/** Detects Arrow vectors returned for nested list or union values. */
function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}
