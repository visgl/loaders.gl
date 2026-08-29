// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowDimension, GeoArrowEncoding, GeoParquetGeometryType} from '@loaders.gl/schema';
import {
  getGeoArrowUnionDimension,
  getGeoArrowUnionGeometryKind,
  type GeoArrowUnionGeometryKind
} from './geoarrow-union';

/**
 * Writes concrete native GeoArrow rows to WKB without creating GeoJSON objects.
 *
 * @param column Native GeoArrow vector.
 * @param sourceEncoding Native source encoding.
 * @param dimension Optional semantic coordinate dimension.
 * @param geometryTypes Optional metadata used to distinguish XYZ from XYM.
 * @returns WKB Arrow vector, or `null` for unsupported source encodings.
 */
export function encodeGeoArrowWKBVector(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension,
  geometryTypes?: readonly GeoParquetGeometryType[]
): arrow.Vector | null {
  if (!isConcreteEncoding(sourceEncoding)) return null;
  const values: (Uint8Array | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      values.push(null);
      continue;
    }
    const geometryValues = readGeometryValues(value, sourceEncoding);
    const effectiveDimension = dimension || getDimensionFromGeometryTypes(geometryTypes);
    const coordinateSize = effectiveDimension
      ? getDimensionSize(effectiveDimension)
      : findCoordinateSize(geometryValues) || getNativeCoordinateSize(column.type) || 2;
    if (!coordinateSize) return null;
    values.push(writeWKB(geometryValues, sourceEncoding, coordinateSize, effectiveDimension));
  }
  return arrow.vectorFromArray(values, new arrow.Binary());
}

/**
 * Writes primitive dense-union GeoArrow rows to WKB while preserving each child's dimension.
 *
 * @param column Dense-union GeoArrow vector.
 * @returns WKB Arrow vector, or `null` for a non-canonical union child.
 */
export function encodeGeoArrowUnionWKBVector(column: arrow.Vector): arrow.Vector | null {
  if (!(column.type instanceof arrow.DenseUnion)) return null;
  const unionType = column.type;
  const values: (Uint8Array | null)[] = [];

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const {typeId, valueOffset} = getDenseUnionCellInfo(column, rowIndex);
    const childIndex = unionType.typeIds.indexOf(typeId);
    const childField = childIndex >= 0 ? unionType.children[childIndex] : undefined;
    const geometryKind = getGeoArrowUnionGeometryKind(childField?.name, typeId);
    const dimension = getGeoArrowUnionDimension(childField?.name, childField?.type, typeId);
    if (!geometryKind || !dimension) return null;
    if (childIndex < 0) return null;
    const childVector = getUnionChildVector(column, childIndex);
    const value = childVector?.get(valueOffset);
    if (value == null) {
      values.push(null);
      continue;
    }
    values.push(encodeUnionValueToWKB(value, geometryKind, dimension));
  }

  return arrow.vectorFromArray(values, new arrow.Binary());
}

/** Writes a `geoarrow.geometrycollection` list vector to WKB without a GeoJSON bridge. */
export function encodeGeoArrowGeometryCollectionWKBVector(
  column: arrow.Vector
): arrow.Vector | null {
  if (!(column.type instanceof arrow.List) && !(column.type instanceof arrow.LargeList)) {
    return null;
  }
  const values: (Uint8Array | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const collection = column.get(rowIndex);
    if (collection == null) {
      values.push(null);
      continue;
    }
    if (!isVectorLike(collection) || !(collection.type instanceof arrow.DenseUnion)) return null;
    const dimension = getCollectionDimension(collection as arrow.Vector);
    const bytes = encodeGeometryCollectionToWKB(collection as arrow.Vector, dimension);
    if (!bytes) return null;
    values.push(bytes);
  }
  return arrow.vectorFromArray(values, new arrow.Binary());
}

function encodeUnionValueToWKB(
  value: unknown,
  geometryKind: GeoArrowUnionGeometryKind,
  dimension: GeoArrowDimension
): Uint8Array | null {
  if (geometryKind === 'GeometryCollection') {
    return encodeGeometryCollectionToWKB(value, dimension);
  }
  const encoding = `geoarrow.${geometryKind.toLowerCase()}` as GeoArrowEncoding;
  const geometryValues = readGeometryValues(value, encoding);
  return writeWKB(geometryValues, encoding, getDimensionSize(dimension), dimension);
}

function encodeGeometryCollectionToWKB(
  value: unknown,
  dimension: GeoArrowDimension
): Uint8Array | null {
  if (!isVectorLike(value) || !(value.type instanceof arrow.DenseUnion)) return null;
  const unionVector = value as arrow.Vector;
  const childBytes: Uint8Array[] = [];
  for (let rowIndex = 0; rowIndex < unionVector.length; rowIndex++) {
    const {typeId, valueOffset} = getDenseUnionCellInfo(unionVector, rowIndex);
    const childIndex = unionVector.type.typeIds.indexOf(typeId);
    const childField = childIndex >= 0 ? unionVector.type.children[childIndex] : undefined;
    const geometryKind = getGeoArrowUnionGeometryKind(childField?.name, typeId);
    const childDimension = getGeoArrowUnionDimension(childField?.name, childField?.type, typeId);
    if (!geometryKind || !childDimension) return null;
    if (childIndex < 0) return null;
    const childValue = getUnionChildVector(unionVector, childIndex)?.get(valueOffset);
    if (childValue == null) return null;
    const bytes = encodeUnionValueToWKB(childValue, geometryKind, childDimension);
    if (!bytes) return null;
    childBytes.push(bytes);
  }

  const headerLength = 9;
  const byteLength = headerLength + childBytes.reduce((total, bytes) => total + bytes.length, 0);
  const bytes = new Uint8Array(byteLength);
  const dataView = new DataView(bytes.buffer);
  dataView.setUint8(0, 1);
  dataView.setUint32(1, 7 + getDimensionOffset(getDimensionSize(dimension), dimension), true);
  dataView.setUint32(5, childBytes.length, true);
  let byteOffset = headerLength;
  for (const child of childBytes) {
    bytes.set(child, byteOffset);
    byteOffset += child.length;
  }
  return bytes;
}

function getCollectionDimension(unionVector: arrow.Vector): GeoArrowDimension {
  for (let rowIndex = 0; rowIndex < unionVector.length; rowIndex++) {
    const {typeId} = getDenseUnionCellInfo(unionVector, rowIndex);
    const childIndex = unionVector.type.typeIds.indexOf(typeId);
    const childField = childIndex >= 0 ? unionVector.type.children[childIndex] : undefined;
    const dimension = getGeoArrowUnionDimension(childField?.name, childField?.type, typeId);
    if (dimension) return dimension;
  }
  return 'xy';
}

type GeometryValues = number[] | GeometryValues[];

function readGeometryValues(value: unknown, encoding: GeoArrowEncoding): GeometryValues {
  if (encoding === 'geoarrow.point') return readCoordinate(value);
  const children = readChildren(value);
  const childEncoding =
    encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multipoint'
      ? 'coordinate'
      : encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multilinestring'
        ? 'sequence'
        : 'nested-sequence';
  return children.map(child =>
    childEncoding === 'coordinate'
      ? readCoordinate(child)
      : childEncoding === 'sequence'
        ? readChildren(child).map(readCoordinate)
        : readChildren(child).map(grandchild => readChildren(grandchild).map(readCoordinate))
  );
}

function writeWKB(
  values: GeometryValues,
  encoding: GeoArrowEncoding,
  coordinateSize: 2 | 3 | 4,
  dimension?: GeoArrowDimension
): Uint8Array {
  const geometryType = getGeometryType(encoding) + getDimensionOffset(coordinateSize, dimension);
  const byteLength = getWKBByteLength(values, encoding, coordinateSize);
  const bytes = new Uint8Array(byteLength);
  const dataView = new DataView(bytes.buffer);
  let byteOffset = 0;
  byteOffset = writeGeometry(dataView, byteOffset, values, encoding, coordinateSize, geometryType);
  if (byteOffset !== byteLength) throw new Error('Native GeoArrow WKB writer size mismatch');
  return bytes;
}

function getWKBByteLength(
  values: GeometryValues,
  encoding: GeoArrowEncoding,
  coordinateSize: number
): number {
  const headerLength = 5;
  switch (encoding) {
    case 'geoarrow.point':
      return headerLength + coordinateSize * 8;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      return (
        headerLength +
        4 +
        values.length *
          (encoding === 'geoarrow.multipoint'
            ? headerLength + coordinateSize * 8
            : coordinateSize * 8)
      );
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring': {
      const sequences = values as GeometryValues[][];
      return (
        headerLength +
        4 +
        sequences.reduce(
          (total, sequence) =>
            total +
            4 +
            sequence.length * coordinateSize * 8 +
            (encoding === 'geoarrow.multilinestring' ? 5 : 0),
          0
        )
      );
    }
    case 'geoarrow.multipolygon': {
      const polygons = values as GeometryValues[][][];
      return (
        headerLength +
        4 +
        polygons.reduce(
          (total, polygon) =>
            total +
            headerLength +
            4 +
            polygon.reduce(
              (polygonTotal, ring) => polygonTotal + 4 + ring.length * coordinateSize * 8,
              0
            ),
          0
        )
      );
    }
    default:
      throw new Error(`Unsupported native WKB encoding ${encoding}`);
  }
}

function writeGeometry(
  dataView: DataView,
  byteOffset: number,
  values: GeometryValues,
  encoding: GeoArrowEncoding,
  coordinateSize: 2 | 3 | 4,
  geometryType: number
): number {
  dataView.setUint8(byteOffset++, 1);
  dataView.setUint32(byteOffset, geometryType, true);
  byteOffset += 4;
  switch (encoding) {
    case 'geoarrow.point':
      return writeCoordinate(dataView, byteOffset, values as number[], coordinateSize);
    case 'geoarrow.linestring':
      return writeSequence(dataView, byteOffset, values as GeometryValues[], coordinateSize);
    case 'geoarrow.polygon':
      return writeNestedSequence(
        dataView,
        byteOffset,
        values as GeometryValues[][],
        coordinateSize
      );
    case 'geoarrow.multipoint':
      return writeMultiPoint(
        dataView,
        byteOffset,
        values as GeometryValues[],
        coordinateSize,
        geometryType
      );
    case 'geoarrow.multilinestring':
      return writeMultiLineString(
        dataView,
        byteOffset,
        values as GeometryValues[][],
        coordinateSize,
        geometryType
      );
    case 'geoarrow.multipolygon':
      return writeMultiPolygon(
        dataView,
        byteOffset,
        values as GeometryValues[][][],
        coordinateSize,
        geometryType
      );
    default:
      throw new Error(`Unsupported native WKB encoding ${encoding}`);
  }
}

function writeCoordinate(
  dataView: DataView,
  byteOffset: number,
  coordinate: number[],
  coordinateSize: number
): number {
  for (let index = 0; index < coordinateSize; index++) {
    dataView.setFloat64(byteOffset, coordinate[index] ?? Number.NaN, true);
    byteOffset += 8;
  }
  return byteOffset;
}

function writeSequence(
  dataView: DataView,
  byteOffset: number,
  values: GeometryValues[],
  coordinateSize: number
): number {
  dataView.setUint32(byteOffset, values.length, true);
  byteOffset += 4;
  for (const coordinate of values)
    byteOffset = writeCoordinate(dataView, byteOffset, coordinate as number[], coordinateSize);
  return byteOffset;
}

function writeNestedSequence(
  dataView: DataView,
  byteOffset: number,
  values: GeometryValues[][],
  coordinateSize: number
): number {
  dataView.setUint32(byteOffset, values.length, true);
  byteOffset += 4;
  for (const sequence of values)
    byteOffset = writeSequence(dataView, byteOffset, sequence, coordinateSize);
  return byteOffset;
}

function writeMultiPoint(
  dataView: DataView,
  byteOffset: number,
  values: GeometryValues[],
  coordinateSize: number,
  geometryType: number
): number {
  dataView.setUint32(byteOffset, values.length, true);
  byteOffset += 4;
  for (const coordinate of values) {
    dataView.setUint8(byteOffset++, 1);
    dataView.setUint32(byteOffset, 1 + geometryType - 4, true);
    byteOffset += 4;
    byteOffset = writeCoordinate(dataView, byteOffset, coordinate as number[], coordinateSize);
  }
  return byteOffset;
}

function writeMultiLineString(
  dataView: DataView,
  byteOffset: number,
  values: GeometryValues[][],
  coordinateSize: number,
  geometryType: number
): number {
  dataView.setUint32(byteOffset, values.length, true);
  byteOffset += 4;
  for (const sequence of values) {
    dataView.setUint8(byteOffset++, 1);
    dataView.setUint32(byteOffset, 2 + geometryType - 5, true);
    byteOffset += 4;
    byteOffset = writeSequence(dataView, byteOffset, sequence, coordinateSize);
  }
  return byteOffset;
}

function writeMultiPolygon(
  dataView: DataView,
  byteOffset: number,
  values: GeometryValues[][][],
  coordinateSize: number,
  geometryType: number
): number {
  dataView.setUint32(byteOffset, values.length, true);
  byteOffset += 4;
  for (const polygon of values) {
    dataView.setUint8(byteOffset++, 1);
    dataView.setUint32(byteOffset, 3 + geometryType - 6, true);
    byteOffset += 4;
    byteOffset = writeNestedSequence(dataView, byteOffset, polygon, coordinateSize);
  }
  return byteOffset;
}

function readChildren(value: unknown): unknown[] {
  if (isVectorLike(value))
    return Array.from({length: value.length}, (_, index) => value.get(index));
  if (Array.isArray(value)) return value;
  return [];
}

function readCoordinate(value: unknown): number[] {
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    const vectorValue = value as {length?: number; isValid?: (index: number) => boolean};
    if (
      vectorValue.length &&
      vectorValue.isValid &&
      Array.from({length: vectorValue.length}, (_, index) => vectorValue.isValid!(index)).every(
        valid => !valid
      )
    ) {
      return [];
    }
    return Array.from((value as {toArray(): ArrayLike<number>}).toArray());
  }
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const record = value as {x: number; y: number; z?: number; m?: number};
    if (record.x == null && record.y == null && record.z == null && record.m == null) {
      return [];
    }
    return [
      record.x,
      record.y,
      ...(['z', 'm'] as const).filter(name => name in record).map(name => record[name]!)
    ];
  }
  return Array.from(value as ArrayLike<number>);
}

function findCoordinateSize(values: GeometryValues): 2 | 3 | 4 | null {
  if (values.length > 0 && typeof values[0] === 'number')
    return Math.min(Math.max(values.length, 2), 4) as 2 | 3 | 4;
  for (const child of values) {
    const coordinateSize = findCoordinateSize(child as GeometryValues);
    if (coordinateSize) return coordinateSize;
  }
  return null;
}

/** Finds the physical coordinate width when every native row is empty. */
function getNativeCoordinateSize(type: arrow.DataType): 2 | 3 | 4 | null {
  if (type instanceof arrow.FixedSizeList) {
    return type.listSize >= 2 && type.listSize <= 4 ? (type.listSize as 2 | 3 | 4) : null;
  }
  if (type instanceof arrow.Struct) {
    const coordinateNames = new Set(['x', 'y', 'z', 'm']);
    const names = type.children.map(field => field.name);
    if (names.every(name => coordinateNames.has(name))) {
      return names.length >= 2 && names.length <= 4 ? (names.length as 2 | 3 | 4) : null;
    }
  }
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    return getNativeCoordinateSize(type.children[0].type);
  }
  return null;
}

function getGeometryType(encoding: GeoArrowEncoding): number {
  return (
    {
      ['geoarrow.point']: 1,
      ['geoarrow.linestring']: 2,
      ['geoarrow.polygon']: 3,
      ['geoarrow.multipoint']: 4,
      ['geoarrow.multilinestring']: 5,
      ['geoarrow.multipolygon']: 6
    }[encoding] || 0
  );
}

function getDimensionOffset(coordinateSize: number, dimension?: GeoArrowDimension): number {
  if (dimension === 'xym') return 2000;
  if (dimension === 'xyzm') return 3000;
  if (dimension === 'xyz' || coordinateSize === 3) return 1000;
  if (coordinateSize === 4) return 3000;
  return 0;
}

function getDimensionSize(dimension: GeoArrowDimension): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

/** Returns a semantic dimension when every declared geometry type uses the same suffix. */
function getDimensionFromGeometryTypes(
  geometryTypes?: readonly GeoParquetGeometryType[]
): GeoArrowDimension | undefined {
  if (!geometryTypes || geometryTypes.length === 0) return undefined;
  const dimensions = new Set(
    geometryTypes.map(geometryType =>
      geometryType.endsWith(' ZM')
        ? 'xyzm'
        : geometryType.endsWith(' Z')
          ? 'xyz'
          : geometryType.endsWith(' M')
            ? 'xym'
            : 'xy'
    )
  );
  return dimensions.size === 1 ? ([...dimensions][0] as GeoArrowDimension) : undefined;
}

function isConcreteEncoding(encoding: GeoArrowEncoding): boolean {
  return (
    encoding !== 'geoarrow.geometry' &&
    encoding !== 'geoarrow.geometrycollection' &&
    encoding !== 'geoarrow.box' &&
    encoding !== 'geoarrow.wkb' &&
    encoding !== 'geoarrow.wkt'
  );
}

function isVectorLike(
  value: unknown
): value is {length: number; get(index: number): unknown; type: arrow.DataType} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}

function getUnionChildVector(vector: arrow.Vector, childIndex: number): arrow.Vector | null {
  const childData = vector.data[0]?.children[childIndex];
  return childData ? arrow.makeVector(childData) : null;
}

function getDenseUnionCellInfo(
  vector: arrow.Vector,
  rowIndex: number
): {typeId: number; valueOffset: number} {
  let remainingRowIndex = rowIndex;
  for (const chunk of vector.data) {
    if (remainingRowIndex < chunk.length) {
      const typeIdIndex = getUnionBufferIndex(
        chunk.typeIds.length,
        chunk.offset,
        remainingRowIndex,
        chunk.typeIds.length <= chunk.length
      );
      const valueOffsetIndex = getUnionBufferIndex(
        chunk.valueOffsets.length,
        chunk.offset,
        remainingRowIndex,
        chunk.typeIds.length <= chunk.length
      );
      return {
        typeId: chunk.typeIds[typeIdIndex],
        valueOffset: chunk.valueOffsets[valueOffsetIndex]
      };
    }
    remainingRowIndex -= chunk.length;
  }
  throw new Error(`DenseUnion row ${rowIndex} is out of bounds.`);
}

function getUnionBufferIndex(
  bufferLength: number,
  offset: number,
  rowIndex: number,
  useLogicalIndex: boolean
): number {
  if (useLogicalIndex) return rowIndex;
  const physicalIndex = offset + rowIndex;
  return physicalIndex < bufferLength ? physicalIndex : rowIndex;
}
