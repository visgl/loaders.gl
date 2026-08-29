// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowOffsetType
} from '@loaders.gl/schema';
import {getGeoArrowUnionDimension, getGeoArrowUnionGeometryKind} from './geoarrow-union';

type NativeEncoding =
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon';

type NativeCoordinates = number[] | NativeCoordinates[];

type GeometryUnionKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon';

/**
 * Converts a concrete native GeoArrow vector without materializing GeoJSON geometries.
 *
 * The structural kernel handles the physically compatible single/multi promotions and can
 * transpose coordinate layout while rebuilding only the requested Arrow buffers.
 *
 * @param column Native GeoArrow vector.
 * @param sourceEncoding Concrete source encoding.
 * @param targetEncoding Concrete target encoding.
 * @param dimension Optional output coordinate dimension.
 * @param coordinates Output coordinate layout.
 * @param offsetType Output list offset width.
 * @returns Converted vector, or `null` when the source cannot be read structurally.
 */
export function convertNativeGeoArrowVector(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  targetEncoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  offsetType: GeoArrowOffsetType = 'int32'
): arrow.Vector | null {
  if (!isNativeEncoding(sourceEncoding) || !isNativeEncoding(targetEncoding)) return null;
  if (!areNativeEncodingsCompatible(sourceEncoding, targetEncoding)) return null;

  const sourceDepth = getEncodingDepth(sourceEncoding);
  const targetDepth = getEncodingDepth(targetEncoding);
  const inferredDimension = inferVectorDimension(column);
  const targetDimension = dimension ? getDimensionSize(dimension) : inferredDimension?.size || 2;
  const targetDimensionName =
    dimension || inferredDimension?.name || getDimensionName(targetDimension);
  const coordinateType = getSourceCoordinateType(column.type) || new arrow.Float64();

  const bufferVector = convertNativeGeoArrowBuffers(
    column,
    sourceDepth,
    targetDepth,
    targetDimension,
    targetDimensionName,
    coordinates,
    offsetType,
    coordinateType
  );
  if (bufferVector) return bufferVector;

  const nativeValues: (NativeCoordinates | null)[] = [];

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      nativeValues.push(null);
      continue;
    }
    const sourceValue = readNativeValue(value, sourceDepth);
    if (!sourceValue) return null;
    const reshapedValue = reshapeNativeValue(sourceValue, sourceDepth, targetDepth);
    if (!reshapedValue) return null;
    nativeValues.push(
      normalizeNativeDimensions(reshapedValue, targetDimension, coordinates, targetDimensionName)
    );
  }

  return arrow.vectorFromArray(
    nativeValues,
    getNativeArrowType(
      targetEncoding,
      targetDimension,
      targetDimensionName,
      coordinates,
      offsetType,
      coordinateType
    )
  );
}

/**
 * Converts a GeoArrow geometry dense union to a representable concrete native encoding.
 *
 * This path reads union children as native coordinate values and never creates GeoJSON objects.
 * It is intentionally limited to the single-to-multi promotions supported by the native kernel;
 * arbitrary mixed families and GeometryCollections remain union-shaped.
 *
 * @param column Dense union GeoArrow vector.
 * @param targetEncoding Concrete target encoding.
 * @param dimension Optional output coordinate dimension.
 * @param coordinates Output coordinate layout.
 * @param offsetType Output list offset width.
 * @returns Converted vector, or `null` when the union is not representable.
 */
export function convertNativeGeoArrowUnionVector(
  column: arrow.Vector,
  targetEncoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  offsetType: GeoArrowOffsetType = 'int32'
): arrow.Vector | null {
  if (!(column.type instanceof arrow.DenseUnion) || !isNativeEncoding(targetEncoding)) return null;

  const targetDepth = getEncodingDepth(targetEncoding);
  const inferredDimension = inferUnionDimension(column.type);
  if (!dimension && !inferredDimension) return null;
  const targetDimension = dimension ? getDimensionSize(dimension) : inferredDimension?.size || 2;
  const targetDimensionName =
    dimension || inferredDimension?.name || getDimensionName(targetDimension);
  const nativeValues: (NativeCoordinates | null)[] = [];
  const childVectorCache = new WeakMap<arrow.Data, Map<number, arrow.Vector>>();

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const cell = getUnionCell(column, rowIndex);
    if (!cell) {
      nativeValues.push(null);
      continue;
    }
    const childField = column.type.children[cell.childIndex];
    const sourceKind = getUnionKind(childField?.name, cell.typeId);
    if (!isUnionKindCompatible(sourceKind, targetEncoding)) return null;
    const childData = cell.chunk.children[cell.childIndex];
    if (!childData) return null;
    let childVectors = childVectorCache.get(cell.chunk);
    if (!childVectors) {
      childVectors = new Map();
      childVectorCache.set(cell.chunk, childVectors);
    }
    let childVector = childVectors.get(cell.childIndex);
    if (!childVector) {
      childVector = arrow.makeVector(childData);
      childVectors.set(cell.childIndex, childVector);
    }
    const childValue = childVector.get(cell.valueOffset);
    if (childValue == null) {
      nativeValues.push(null);
      continue;
    }
    const sourceValue = readNativeValue(childValue, getEncodingDepthForKind(sourceKind));
    if (!sourceValue) return null;
    const reshapedValue = reshapeNativeValue(
      sourceValue,
      getEncodingDepthForKind(sourceKind),
      targetDepth
    );
    if (!reshapedValue) return null;
    nativeValues.push(
      normalizeNativeDimensions(reshapedValue, targetDimension, coordinates, targetDimensionName)
    );
  }

  return arrow.vectorFromArray(
    nativeValues,
    getNativeArrowType(
      targetEncoding,
      targetDimension,
      targetDimensionName,
      coordinates,
      offsetType
    )
  );
}

/** Returns the dense-union child and value location for one logical row. */
function getUnionCell(
  column: arrow.Vector,
  rowIndex: number
): {chunk: arrow.Data; childIndex: number; typeId: number; valueOffset: number} | null {
  let remainingRowIndex = rowIndex;
  const unionType = column.type as arrow.DenseUnion;
  for (const chunk of column.data) {
    if (remainingRowIndex >= chunk.length) {
      remainingRowIndex -= chunk.length;
      continue;
    }
    const bufferIndex =
      chunk.typeIds.length <= chunk.length ? remainingRowIndex : chunk.offset + remainingRowIndex;
    const typeId = chunk.typeIds[bufferIndex];
    const valueOffset = chunk.valueOffsets[bufferIndex];
    const childIndex = unionType.typeIds.indexOf(typeId);
    if (childIndex < 0 || valueOffset < 0) return null;
    return {chunk, childIndex, typeId, valueOffset};
  }
  return null;
}

/** Maps a standard GeoArrow dense-union type id to a geometry family. */
function getUnionKind(fieldName: string | undefined, typeId: number): GeometryUnionKind {
  const kind = getGeoArrowUnionGeometryKind(fieldName, typeId);
  if (!kind || kind === 'GeometryCollection') {
    throw new Error(`Unsupported GeoArrow union type id "${typeId}".`);
  }
  return kind;
}

/** Checks whether a union family can be represented by the requested concrete encoding. */
function isUnionKindCompatible(kind: GeometryUnionKind, targetEncoding: NativeEncoding): boolean {
  return (
    (targetEncoding === 'geoarrow.point' && kind === 'Point') ||
    (targetEncoding === 'geoarrow.multipoint' && (kind === 'Point' || kind === 'MultiPoint')) ||
    (targetEncoding === 'geoarrow.linestring' && kind === 'LineString') ||
    (targetEncoding === 'geoarrow.multilinestring' &&
      (kind === 'LineString' || kind === 'MultiLineString')) ||
    (targetEncoding === 'geoarrow.polygon' && kind === 'Polygon') ||
    (targetEncoding === 'geoarrow.multipolygon' && (kind === 'Polygon' || kind === 'MultiPolygon'))
  );
}

/** Returns the native nesting depth for a union child family. */
function getEncodingDepthForKind(kind: GeometryUnionKind): 0 | 1 | 2 | 3 {
  switch (kind) {
    case 'Point':
      return 0;
    case 'LineString':
    case 'MultiPoint':
      return 1;
    case 'Polygon':
    case 'MultiLineString':
      return 2;
    case 'MultiPolygon':
      return 3;
  }
}

/** Infers a union's coordinate dimension from its first concrete child. */
function inferUnionDimension(
  type: arrow.DenseUnion
): {size: 2 | 3 | 4; name: GeoArrowDimension} | null {
  let inferredDimension: {size: 2 | 3 | 4; name: GeoArrowDimension} | null = null;
  for (const [childIndex, field] of type.children.entries()) {
    const kind = getUnionKind(field.name, type.typeIds[childIndex]);
    const unionDimension = getGeoArrowUnionDimension(
      field.name,
      field.type,
      type.typeIds[childIndex]
    );
    if (unionDimension) {
      const dimension = {size: getDimensionSize(unionDimension), name: unionDimension};
      if (inferredDimension && inferredDimension.name !== dimension.name) return null;
      inferredDimension = dimension;
      continue;
    }
    const dimension = inferVectorTypeDimension(field.type, kind, field.name);
    if (!dimension) continue;
    if (inferredDimension && inferredDimension.name !== dimension.name) return null;
    inferredDimension = dimension;
  }
  return inferredDimension;
}

/** Infers coordinate dimension while preserving separated XYZ versus XYM field names. */
function inferVectorTypeDimension(
  type: arrow.DataType,
  kind: GeometryUnionKind,
  fieldName?: string
): {size: 2 | 3 | 4; name: GeoArrowDimension} | null {
  let coordinateType = type;
  for (let depth = getEncodingDepthForKind(kind); depth > 0; depth--) {
    if (!(coordinateType instanceof arrow.List || coordinateType instanceof arrow.LargeList)) {
      return null;
    }
    coordinateType = coordinateType.children[0].type;
  }
  const dimension = getSourceCoordinateDimension(coordinateType);
  if (!dimension || !fieldName) return dimension;
  if (dimension.size === 3 && fieldName.endsWith(' M')) {
    return {size: 3, name: 'xym'};
  }
  if (dimension.size === 3 && fieldName.endsWith(' Z')) {
    return {size: 3, name: 'xyz'};
  }
  return dimension;
}

/**
 * Converts the common Arrow Data layout without calling `Vector.get()` for each geometry.
 *
 * Destination Data chunks are always normalized to offset zero. Arrow slices may expose either
 * the full backing buffer with a nonzero offset or a shortened view, so every buffer read below
 * resolves both layouts without materializing geometry values.
 */
function convertNativeGeoArrowBuffers(
  column: arrow.Vector,
  sourceDepth: 0 | 1 | 2 | 3,
  targetDepth: 0 | 1 | 2 | 3,
  targetDimension: 2 | 3 | 4,
  targetDimensionName: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout,
  offsetType: GeoArrowOffsetType,
  coordinateType: arrow.Float32 | arrow.Float64
): arrow.Vector | null {
  if (targetDepth < sourceDepth || targetDepth > sourceDepth + 1) return null;

  const targetType = getNativeArrowType(
    getNativeEncodingAtDepth(column.type, sourceDepth, targetDepth),
    targetDimension,
    targetDimensionName,
    coordinates,
    offsetType,
    coordinateType
  );
  const sourceType = column.type;
  const convertedData: arrow.Data[] = [];

  for (const data of column.data) {
    const converted = convertNativeData(
      data,
      sourceType,
      targetType,
      sourceDepth,
      targetDepth,
      targetDimension,
      targetDimensionName,
      coordinates,
      offsetType,
      coordinateType
    );
    if (!converted) return null;
    convertedData.push(converted);
  }

  return new arrow.Vector(convertedData);
}

/** Returns a concrete encoding with the requested nesting depth for Arrow type construction. */
function getNativeEncodingAtDepth(
  type: arrow.DataType,
  sourceDepth: 0 | 1 | 2 | 3,
  targetDepth: 0 | 1 | 2 | 3
): NativeEncoding {
  if (targetDepth === sourceDepth && type instanceof arrow.FixedSizeList) {
    return 'geoarrow.point';
  }
  switch (targetDepth) {
    case 0:
      return 'geoarrow.point';
    case 1:
      return 'geoarrow.linestring';
    case 2:
      return 'geoarrow.polygon';
    case 3:
      return 'geoarrow.multipolygon';
  }
}

function convertNativeData(
  sourceData: arrow.Data,
  sourceType: arrow.DataType,
  targetType: arrow.DataType,
  sourceDepth: number,
  targetDepth: number,
  targetDimension: 2 | 3 | 4,
  targetDimensionName: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout,
  offsetType: GeoArrowOffsetType,
  coordinateType: arrow.Float32 | arrow.Float64
): arrow.Data | null {
  if (sourceDepth === 0) {
    return convertNativeCoordinateData(
      sourceData,
      sourceType,
      targetType,
      targetDimension,
      targetDimensionName,
      coordinates,
      coordinateType
    );
  }

  if (
    !(sourceType instanceof arrow.List || sourceType instanceof arrow.LargeList) ||
    !(targetType instanceof arrow.List || targetType instanceof arrow.LargeList) ||
    sourceData.children.length !== 1
  ) {
    return null;
  }

  if (targetDepth > sourceDepth) {
    const promotedChild = convertNativeData(
      sourceData,
      sourceType,
      targetType.children[0].type,
      sourceDepth,
      sourceDepth,
      targetDimension,
      targetDimensionName,
      coordinates,
      offsetType,
      coordinateType
    );
    if (!promotedChild) return null;

    const promotedOffsets =
      targetType instanceof arrow.LargeList
        ? BigInt64Array.from({length: sourceData.length + 1}, (_, index) => BigInt(index))
        : Int32Array.from({length: sourceData.length + 1}, (_, index) => index);
    return makeNativeData(
      targetType,
      sourceData.length,
      sourceData.nullCount,
      getNativeNullBitmap(sourceData),
      promotedOffsets,
      [promotedChild]
    );
  }

  const sourceChildType = sourceType.children[0].type;
  const targetChildType = targetType.children[0].type;
  const childDepth = sourceDepth - 1;
  const convertedChild = convertNativeData(
    sourceData.children[0],
    sourceChildType,
    targetChildType,
    childDepth,
    childDepth,
    targetDimension,
    targetDimensionName,
    coordinates,
    offsetType,
    coordinateType
  );
  if (!convertedChild) return null;

  const valueOffsets = convertNativeOffsets(
    sourceData.valueOffsets,
    sourceData.offset,
    sourceData.length,
    sourceData.length + 1,
    targetType instanceof arrow.LargeList
  );
  if (!valueOffsets) return null;

  return makeNativeData(
    targetType,
    sourceData.length,
    sourceData.nullCount,
    getNativeNullBitmap(sourceData),
    valueOffsets,
    [convertedChild]
  );
}

function convertNativeCoordinateData(
  sourceData: arrow.Data,
  sourceType: arrow.DataType,
  targetType: arrow.DataType,
  targetDimension: 2 | 3 | 4,
  targetDimensionName: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout,
  coordinateType: arrow.Float32 | arrow.Float64
): arrow.Data | null {
  const sourceDimension = getSourceCoordinateDimension(sourceType);
  if (!sourceDimension) return null;

  const coordinateCount = sourceData.length;
  const coordinateValues = new (
    coordinateType instanceof arrow.Float32 ? Float32Array : Float64Array
  )(coordinateCount * targetDimension);
  const targetNames = getCoordinateNames(targetDimensionName);
  const sourceNames = getCoordinateNames(sourceDimension.name);

  if (sourceType instanceof arrow.FixedSizeList) {
    const sourceDataChild = sourceData.children[0];
    const sourceValues = sourceDataChild?.values;
    if (!sourceValues) return null;
    for (let coordinateIndex = 0; coordinateIndex < coordinateCount; coordinateIndex++) {
      for (let targetAxisIndex = 0; targetAxisIndex < targetDimension; targetAxisIndex++) {
        // Fixed-size lists have no axis names. Their semantic Z/M meaning comes from field
        // metadata, so explicit output dimensions retain positional coordinates.
        const sourceAxisIndex =
          targetDimension === sourceDimension.size
            ? targetAxisIndex
            : sourceNames.indexOf(targetNames[targetAxisIndex]);
        coordinateValues[coordinateIndex * targetDimension + targetAxisIndex] =
          sourceAxisIndex >= 0
            ? Number(
                readDataValue(
                  sourceDataChild,
                  coordinateIndex * sourceDimension.size + sourceAxisIndex
                )
              )
            : 0;
      }
    }
  } else if (sourceType instanceof arrow.Struct) {
    const sourceChildren = new Map(
      sourceType.children.map((field, index) => [field.name, sourceData.children[index]])
    );
    for (let coordinateIndex = 0; coordinateIndex < coordinateCount; coordinateIndex++) {
      for (let targetAxisIndex = 0; targetAxisIndex < targetDimension; targetAxisIndex++) {
        const sourceChild = sourceChildren.get(targetNames[targetAxisIndex]);
        if (!sourceChild || !sourceChild.values) return null;
        coordinateValues[coordinateIndex * targetDimension + targetAxisIndex] = Number(
          readDataValue(sourceChild, coordinateIndex)
        );
      }
    }
  } else {
    return null;
  }

  if (coordinates === 'separated') {
    if (!(targetType instanceof arrow.Struct)) return null;
    const childData = targetNames.map((name, axisIndex) =>
      makeNativeData(
        targetType.children[axisIndex].type,
        coordinateCount,
        0,
        undefined,
        undefined,
        undefined,
        coordinateValues,
        axisIndex,
        targetDimension
      )
    );
    return makeNativeData(
      targetType,
      coordinateCount,
      sourceData.nullCount,
      getNativeNullBitmap(sourceData),
      undefined,
      childData
    );
  }

  if (!(targetType instanceof arrow.FixedSizeList)) return null;
  const targetValues = makeNativeData(
    targetType.children[0].type,
    coordinateCount * targetDimension,
    0,
    undefined,
    undefined,
    undefined,
    coordinateValues
  );
  return makeNativeData(
    targetType,
    coordinateCount,
    sourceData.nullCount,
    getNativeNullBitmap(sourceData),
    undefined,
    [targetValues]
  );
}

function getSourceCoordinateDimension(
  type: arrow.DataType
): {size: 2 | 3 | 4; name: GeoArrowDimension} | null {
  if (type instanceof arrow.FixedSizeList) {
    const size = type.listSize;
    return size >= 2 && size <= 4
      ? {size: size as 2 | 3 | 4, name: getDimensionName(size as 2 | 3 | 4)}
      : null;
  }
  if (type instanceof arrow.Struct) {
    const names = new Set(type.children.map(child => child.name));
    const size = type.children.length;
    if (size < 2 || size > 4 || !names.has('x') || !names.has('y')) return null;
    const name =
      names.has('z') && names.has('m')
        ? 'xyzm'
        : names.has('m')
          ? 'xym'
          : names.has('z')
            ? 'xyz'
            : 'xy';
    return {size: size as 2 | 3 | 4, name};
  }
  return null;
}

/** Returns the floating-point type used by native coordinate values, when supported. */
function getSourceCoordinateType(type: arrow.DataType): arrow.Float32 | arrow.Float64 | null {
  let coordinateType: arrow.DataType = type;
  while (coordinateType instanceof arrow.List || coordinateType instanceof arrow.LargeList) {
    coordinateType = coordinateType.children[0].type;
  }
  if (coordinateType instanceof arrow.FixedSizeList) {
    coordinateType = coordinateType.children[0].type;
  } else if (coordinateType instanceof arrow.Struct) {
    coordinateType = coordinateType.children[0]?.type;
  }
  return coordinateType instanceof arrow.Float32 || coordinateType instanceof arrow.Float64
    ? coordinateType
    : null;
}

function convertNativeOffsets(
  sourceOffsets: arrow.Data['valueOffsets'],
  sourceOffset: number,
  sourceLength: number,
  requiredLength: number,
  useLargeOffsets: boolean
): Int32Array | BigInt64Array | null {
  if (!sourceOffsets) return null;
  const offsets = new Array<number | bigint>(requiredLength);
  const hasFullView = sourceOffsets.length >= sourceOffset + sourceLength + 1;
  if (!hasFullView && sourceOffsets.length < sourceLength + 1) return null;
  for (let index = 0; index < requiredLength; index++) {
    const sourceIndex = hasFullView ? sourceOffset + index : index;
    const sourceValue = sourceOffsets[sourceIndex];
    if (typeof sourceValue === 'bigint') {
      if (sourceValue < 0n) return null;
      offsets[index] = sourceValue;
    } else {
      if (!Number.isSafeInteger(sourceValue) || sourceValue < 0) return null;
      offsets[index] = sourceValue;
    }
  }
  if (useLargeOffsets) {
    return BigInt64Array.from(offsets, value => BigInt(value));
  }
  if (offsets.some(value => value > 0x7fffffff)) return null;
  return Int32Array.from(offsets, value => Number(value));
}

/** Reads a scalar from a full or shortened Arrow child buffer. */
function readDataValue(data: arrow.Data, logicalIndex: number): number {
  const values = data.values;
  if (!values) return Number.NaN;
  const physicalIndex =
    values.length >= data.offset + data.length ? data.offset + logicalIndex : logicalIndex;
  return Number(values[physicalIndex]);
}

/** Copies validity bits when a sliced Data chunk cannot retain its original offset. */
function getNativeNullBitmap(data: arrow.Data): Uint8Array | undefined {
  if (data.nullCount === 0 || !data.nullBitmap || data.nullBitmap.length === 0) return undefined;
  if (data.offset === 0) return data.nullBitmap;

  const nullBitmap = new Uint8Array(Math.ceil(data.length / 8));
  for (let index = 0; index < data.length; index++) {
    const sourceIndex = data.offset + index;
    if ((data.nullBitmap[sourceIndex >> 3] & (1 << (sourceIndex & 7))) !== 0) {
      nullBitmap[index >> 3] |= 1 << (index & 7);
    }
  }
  return nullBitmap;
}

function makeNativeData(
  type: arrow.DataType,
  length: number,
  nullCount: number,
  nullBitmap?: Uint8Array,
  valueOffsets?: Int32Array | BigInt64Array,
  children?: arrow.Data[],
  values?: ArrayLike<number>,
  valuesStart = 0,
  valuesStride = 1
): arrow.Data {
  let dataValues = values;
  if (values && (valuesStart !== 0 || valuesStride !== 1)) {
    const copiedValues = new Float64Array(length);
    for (let index = 0; index < length; index++) {
      copiedValues[index] = Number(values[valuesStart + index * valuesStride]);
    }
    dataValues = copiedValues;
  }
  const buffers: Partial<Record<arrow.BufferType, any>> = {};
  if (nullBitmap) buffers[arrow.BufferType.VALIDITY] = nullBitmap;
  if (valueOffsets) buffers[arrow.BufferType.OFFSET] = valueOffsets;
  if (dataValues) buffers[arrow.BufferType.DATA] = dataValues;
  return new arrow.Data(type, 0, length, nullCount, buffers, children);
}

function areNativeEncodingsCompatible(
  sourceEncoding: NativeEncoding,
  targetEncoding: NativeEncoding
): boolean {
  if (sourceEncoding === targetEncoding) return true;
  return (
    (sourceEncoding === 'geoarrow.point' && targetEncoding === 'geoarrow.multipoint') ||
    (sourceEncoding === 'geoarrow.linestring' && targetEncoding === 'geoarrow.multilinestring') ||
    (sourceEncoding === 'geoarrow.polygon' && targetEncoding === 'geoarrow.multipolygon')
  );
}

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

function readNativeValue(value: unknown, depth: number): NativeCoordinates | null {
  if (depth === 0) return readCoordinate(value);
  const children = readChildren(value);
  if (!children) return null;
  const nativeChildren: NativeCoordinates[] = [];
  for (const child of children) {
    const nativeChild = readNativeValue(child, depth - 1);
    if (!nativeChild) return null;
    nativeChildren.push(nativeChild);
  }
  return nativeChildren;
}

function readCoordinate(value: unknown): number[] | null {
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const coordinate = value as {x: number; y: number; z?: number; m?: number};
    const values = [coordinate.x, coordinate.y];
    if (typeof coordinate.z === 'number') values.push(coordinate.z);
    if (typeof coordinate.m === 'number') values.push(coordinate.m);
    return values;
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

function reshapeNativeValue(
  value: NativeCoordinates,
  sourceDepth: number,
  targetDepth: number
): NativeCoordinates | null {
  if (targetDepth === sourceDepth) return value;
  if (targetDepth > sourceDepth) {
    let result = value;
    for (let depth = sourceDepth; depth < targetDepth; depth++) result = [result];
    return result;
  }

  let result = value;
  for (let depth = sourceDepth; depth > targetDepth; depth--) {
    if (!Array.isArray(result) || result.length !== 1) return null;
    result = result[0] as NativeCoordinates;
  }
  return result;
}

function normalizeNativeDimensions(
  value: NativeCoordinates,
  dimension: 2 | 3 | 4,
  coordinates: GeoArrowCoordinateLayout,
  dimensionName: GeoArrowDimension
): NativeCoordinates {
  if (isCoordinate(value)) {
    const paddedCoordinate = value.slice(0, dimension);
    while (paddedCoordinate.length < dimension) paddedCoordinate.push(0);
    return coordinates === 'separated'
      ? (Object.fromEntries(
          getCoordinateNames(dimensionName).map((name, index) => [name, paddedCoordinate[index]])
        ) as unknown as NativeCoordinates)
      : paddedCoordinate;
  }
  return value.map(child =>
    normalizeNativeDimensions(child, dimension, coordinates, dimensionName)
  );
}

function getNativeArrowType(
  encoding: NativeEncoding,
  dimension: 2 | 3 | 4,
  dimensionName: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout,
  offsetType: GeoArrowOffsetType,
  coordinateType: arrow.Float32 | arrow.Float64 = new arrow.Float64()
): arrow.DataType {
  const coordinateDataType = getCoordinateType(
    dimension,
    dimensionName,
    coordinates,
    coordinateType
  );
  const createList = (field: arrow.Field): arrow.DataType =>
    offsetType === 'int64' ? new arrow.LargeList(field) : new arrow.List(field);

  switch (getEncodingDepth(encoding)) {
    case 0:
      return coordinateDataType;
    case 1:
      return createList(new arrow.Field('value', coordinateDataType, true));
    case 2:
      return createList(
        new arrow.Field(
          'value',
          createList(new arrow.Field('value', coordinateDataType, true)),
          true
        )
      );
    case 3:
      return createList(
        new arrow.Field(
          'value',
          createList(
            new arrow.Field(
              'value',
              createList(new arrow.Field('value', coordinateDataType, true)),
              true
            )
          ),
          true
        )
      );
  }
}

function getCoordinateType(
  dimension: 2 | 3 | 4,
  dimensionName: GeoArrowDimension,
  coordinates: GeoArrowCoordinateLayout,
  coordinateType: arrow.Float32 | arrow.Float64
): arrow.DataType {
  if (coordinates === 'separated') {
    return new arrow.Struct(
      getCoordinateNames(dimensionName).map(name => new arrow.Field(name, coordinateType, true))
    );
  }
  return new arrow.FixedSizeList(dimension, new arrow.Field('item', coordinateType, true));
}

function inferVectorDimension(
  column: arrow.Vector
): {size: 2 | 3 | 4; name: GeoArrowDimension} | null {
  let type: arrow.DataType = column.type;
  while (type instanceof arrow.List || type instanceof arrow.LargeList)
    type = type.children[0].type;
  if (type instanceof arrow.FixedSizeList) {
    if (type.listSize < 2 || type.listSize > 4) return null;
    const size = type.listSize as 2 | 3 | 4;
    return {size, name: getDimensionName(size)};
  }
  if (type instanceof arrow.Struct) {
    if (type.children.length < 2 || type.children.length > 4) return null;
    const size = type.children.length as 2 | 3 | 4;
    const childNames = new Set(type.children.map(child => child.name));
    const name =
      childNames.has('m') && childNames.has('z')
        ? 'xyzm'
        : childNames.has('m')
          ? 'xym'
          : childNames.has('z')
            ? 'xyz'
            : getDimensionName(size);
    return {size, name};
  }
  return null;
}

function getDimensionName(dimension: 2 | 3 | 4): GeoArrowDimension {
  return dimension === 2 ? 'xy' : dimension === 4 ? 'xyzm' : 'xyz';
}

function getCoordinateNames(dimension: GeoArrowDimension): readonly string[] {
  switch (dimension) {
    case 'xy':
      return ['x', 'y'];
    case 'xyz':
      return ['x', 'y', 'z'];
    case 'xym':
      return ['x', 'y', 'm'];
    case 'xyzm':
      return ['x', 'y', 'z', 'm'];
  }
}

function isCoordinate(value: NativeCoordinates): value is number[] {
  return Array.isArray(value) && (value.length === 0 || typeof value[0] === 'number');
}

function getDimensionSize(dimension: GeoArrowDimension): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}
