// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {getWKTDimension, getWKTGeometryType} from '@loaders.gl/gis';
import {inspectWKBHeader} from '@math.gl/wkb';
import type {WKBGeometryType} from '@math.gl/wkb';
import type {GeoArrowEncoding, GeoParquetGeometryType} from '@loaders.gl/schema';
import {
  getGeoArrowUnionDimension,
  getGeoArrowUnionGeometryKind,
  type GeoArrowUnionGeometryKind
} from './lib/kernels/geoarrow-union';

/** Header-derived facts collected from a materialized GeoArrow vector. */
export type GeoArrowVectorInspection = Readonly<{
  /** Number of rows inspected. */
  rowCount: number;
  /** Number of null rows. */
  nullCount: number;
  /** Geometry types found in WKB headers. */
  geometryTypes: readonly GeoParquetGeometryType[];
  /** Coordinate dimensions found in WKB headers. */
  dimensions: readonly ('xy' | 'xyz' | 'xym' | 'xyzm')[];
  /** Rows whose WKB headers could not be parsed. */
  malformedRowCount: number;
}>;

/**
 * Inspects a GeoArrow vector without decoding coordinate payloads.
 *
 * For WKB this reads only the endian flag, geometry type, dimensional flags, and optional SRID.
 * Native vectors are classified from their extension encoding and Arrow type. This is intended
 * for adaptive conversion and query planning, not geometry validation.
 *
 * @param column GeoArrow vector to inspect.
 * @param encoding Encoding declared for the vector.
 * @returns Stable header-derived inspection result.
 */
export function inspectGeoArrowVector(
  column: arrow.Vector,
  encoding: GeoArrowEncoding
): GeoArrowVectorInspection {
  const geometryTypes = new Set<GeoParquetGeometryType>();
  const dimensions = new Set<'xy' | 'xyz' | 'xym' | 'xyzm'>();
  let nullCount = 0;
  let malformedRowCount = 0;

  if (encoding === 'geoarrow.geometry' && column.type instanceof arrow.DenseUnion) {
    inspectGeometryUnion(column, geometryTypes, dimensions, () => nullCount++);
    return {
      rowCount: column.length,
      nullCount,
      geometryTypes: [...geometryTypes],
      dimensions: [...dimensions],
      malformedRowCount
    };
  }

  if (
    encoding === 'geoarrow.geometrycollection' &&
    (column.type instanceof arrow.List || column.type instanceof arrow.LargeList) &&
    column.type.children[0]?.type instanceof arrow.DenseUnion
  ) {
    inspectGeometryCollections(column, geometryTypes, dimensions, () => nullCount++);
    return {
      rowCount: column.length,
      nullCount,
      geometryTypes: [...geometryTypes],
      dimensions: [...dimensions],
      malformedRowCount
    };
  }

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      nullCount++;
      continue;
    }
    if (encoding === 'geoarrow.wkb') {
      const bytes = value as Uint8Array;
      try {
        const header = inspectWKBHeader(bytes);
        dimensions.add(header.dimension);
        geometryTypes.add(getGeometryTypeName(header.geometryType, header.dimension));
      } catch {
        malformedRowCount++;
      }
      continue;
    }
    if (encoding === 'geoarrow.wkt') {
      const text = String(value);
      const dimension = getWKTDimension(text);
      const geometryType = getWKTGeometryType(text);
      if (!dimension || geometryType === null) {
        malformedRowCount++;
        continue;
      }
      dimensions.add(dimension);
      geometryTypes.add(getGeometryTypeNameFromCode(geometryType, dimension));
      continue;
    }
    const inferred = inferNativeGeometryType(encoding);
    if (inferred) geometryTypes.add(inferred);
    const dimension = inferNativeDimension(column.type);
    if (dimension) dimensions.add(dimension);
  }

  return {
    rowCount: column.length,
    nullCount,
    geometryTypes: [...geometryTypes],
    dimensions: [...dimensions],
    malformedRowCount
  };
}

/** Inspects the used children of a dense union without reading coordinate buffers. */
function inspectGeometryUnion(
  column: arrow.Vector,
  geometryTypes: Set<GeoParquetGeometryType>,
  dimensions: Set<'xy' | 'xyz' | 'xym' | 'xyzm'>,
  countNull: () => void
): void {
  const unionType = column.type as arrow.DenseUnion;
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    if (column.get(rowIndex) == null) {
      countNull();
      continue;
    }
    const typeId = getUnionTypeId(column, rowIndex);
    const childIndex = unionType.typeIds.indexOf(typeId);
    const child = childIndex >= 0 ? unionType.children[childIndex] : undefined;
    const geometryType = child ? getGeoArrowUnionGeometryKind(child.name, typeId) : null;
    const dimension = child
      ? getGeoArrowUnionDimension(child.name, child.type, typeId)
      : getDimensionFromTypeId(typeId);
    if (geometryType && dimension) {
      geometryTypes.add(addDimensionSuffix(geometryType, dimension));
      dimensions.add(dimension);
    }
  }
}

/** Inspects collection members while reporting the outer collection family. */
function inspectGeometryCollections(
  column: arrow.Vector,
  geometryTypes: Set<GeoParquetGeometryType>,
  dimensions: Set<'xy' | 'xyz' | 'xym' | 'xyzm'>,
  countNull: () => void
): void {
  geometryTypes.add('GeometryCollection');
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      countNull();
      continue;
    }
    if (!isVectorLike(value)) continue;
    const unionVector = value as arrow.Vector;
    const unionType = unionVector.type as arrow.DenseUnion;
    for (let memberIndex = 0; memberIndex < unionVector.length; memberIndex++) {
      if (unionVector.get(memberIndex) == null) continue;
      const typeId = getUnionTypeId(unionVector, memberIndex);
      const childIndex = unionType.typeIds.indexOf(typeId);
      const child = childIndex >= 0 ? unionType.children[childIndex] : undefined;
      const dimension = child
        ? getGeoArrowUnionDimension(child.name, child.type, typeId)
        : getDimensionFromTypeId(typeId);
      if (dimension) dimensions.add(dimension);
    }
  }
}

/** Adds the semantic dimension suffix used by GeoParquet geometry type metadata. */
function addDimensionSuffix(
  geometryType: GeoArrowUnionGeometryKind,
  dimension: 'xy' | 'xyz' | 'xym' | 'xyzm'
): GeoParquetGeometryType {
  if (dimension === 'xy') return geometryType;
  return `${geometryType} ${dimension === 'xyz' ? 'Z' : dimension === 'xym' ? 'M' : 'ZM'}` as GeoParquetGeometryType;
}

/** Returns the dense union type ID for a logical row, including sliced data. */
function getUnionTypeId(column: arrow.Vector, rowIndex: number): number {
  let remainingRowIndex = rowIndex;
  for (const data of column.data) {
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

/** Returns the semantic dimension encoded in a canonical union type ID. */
function getDimensionFromTypeId(typeId: number): 'xy' | 'xyz' | 'xym' | 'xyzm' {
  const dimensionBand = Math.floor(typeId / 10);
  return dimensionBand === 3
    ? 'xyzm'
    : dimensionBand === 2
      ? 'xym'
      : dimensionBand === 1
        ? 'xyz'
        : 'xy';
}

/** Tests Arrow vectors and nested list scalars. */
function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}

function getGeometryTypeNameFromCode(
  geometryType: number,
  dimension: 'xy' | 'xyz' | 'xym' | 'xyzm'
): GeoParquetGeometryType {
  const names = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ] as const;
  const name = names[geometryType - 1];
  if (!name) throw new Error(`Unsupported WKT geometry type ${geometryType}`);
  const suffix =
    dimension === 'xy' ? '' : ` ${dimension === 'xyz' ? 'Z' : dimension === 'xym' ? 'M' : 'ZM'}`;
  return `${name}${suffix}` as GeoParquetGeometryType;
}

function getGeometryTypeName(
  geometryType: WKBGeometryType,
  dimension: 'xy' | 'xyz' | 'xym' | 'xyzm'
): GeoParquetGeometryType {
  const suffix =
    dimension === 'xy' ? '' : ` ${dimension === 'xyz' ? 'Z' : dimension === 'xym' ? 'M' : 'ZM'}`;
  return `${geometryType}${suffix}` as GeoParquetGeometryType;
}

function inferNativeGeometryType(encoding: GeoArrowEncoding): GeoParquetGeometryType | null {
  const geometryTypeByEncoding: Partial<Record<GeoArrowEncoding, GeoParquetGeometryType>> = {
    'geoarrow.point': 'Point',
    'geoarrow.linestring': 'LineString',
    'geoarrow.polygon': 'Polygon',
    'geoarrow.multipoint': 'MultiPoint',
    'geoarrow.multilinestring': 'MultiLineString',
    'geoarrow.multipolygon': 'MultiPolygon',
    'geoarrow.geometrycollection': 'GeometryCollection'
  };
  return geometryTypeByEncoding[encoding] || null;
}

function inferNativeDimension(type: arrow.DataType): 'xy' | 'xyz' | 'xym' | 'xyzm' | null {
  if (type instanceof arrow.FixedSizeList) return dimensionFromSize(type.listSize);
  if (type instanceof arrow.Struct) {
    const names = type.children.map(child => child.name);
    if (names.includes('zmin') && names.includes('mmin')) return 'xyzm';
    if (names.includes('zmin')) return 'xyz';
    if (names.includes('mmin')) return 'xym';
    if (names.includes('xmin')) return dimensionFromSize(type.children.length / 2);
    if (names.includes('z') && names.includes('m')) return 'xyzm';
    if (names.includes('z')) return 'xyz';
    if (names.includes('m')) return 'xym';
    return dimensionFromSize(type.children.length);
  }
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    return inferNativeDimension(type.children[0].type);
  }
  if (type instanceof arrow.DenseUnion) {
    let inferredDimension: 'xy' | 'xyz' | 'xym' | 'xyzm' | null = null;
    for (const child of type.children) {
      const dimension = inferNativeDimension(child.type);
      if (!dimension) continue;
      if (inferredDimension && inferredDimension !== dimension) return null;
      inferredDimension = dimension;
    }
    return inferredDimension;
  }
  return null;
}

function dimensionFromSize(size: number): 'xy' | 'xyz' | 'xym' | 'xyzm' | null {
  return size === 2 ? 'xy' : size === 3 ? 'xyz' : size === 4 ? 'xyzm' : null;
}
