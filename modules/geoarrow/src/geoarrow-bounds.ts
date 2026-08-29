// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {getWKBGeometryStatistics} from '@loaders.gl/gis';
import type {GeoArrowEncoding} from '@loaders.gl/schema';

/** Axis-aligned XY bounds in minX, minY, maxX, maxY order. */
export type GeoArrowBounds = readonly [number, number, number, number];

/**
 * Computes exact per-row XY bounds without creating GeoJSON geometry objects.
 *
 * @param column GeoArrow geometry vector.
 * @param encoding GeoArrow encoding declared for the vector.
 * @returns One bound or `null` per geometry row.
 */
export function getGeoArrowRowBounds(
  column: arrow.Vector,
  encoding: GeoArrowEncoding
): readonly (GeoArrowBounds | null)[] {
  const directBounds = getDirectNativeRowBounds(column, encoding);
  if (directBounds) return directBounds;
  const bounds: (GeoArrowBounds | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    bounds.push(getGeoArrowBounds(column.get(rowIndex), encoding));
  }
  return bounds;
}

/** Computes concrete native bounds from Arrow buffers without constructing row values. */
function getDirectNativeRowBounds(
  column: arrow.Vector,
  encoding: GeoArrowEncoding
): (GeoArrowBounds | null)[] | null {
  if (
    encoding !== 'geoarrow.point' &&
    encoding !== 'geoarrow.linestring' &&
    encoding !== 'geoarrow.polygon' &&
    encoding !== 'geoarrow.multipoint' &&
    encoding !== 'geoarrow.multilinestring' &&
    encoding !== 'geoarrow.multipolygon' &&
    encoding !== 'geoarrow.box' &&
    encoding !== 'geoarrow.geometry' &&
    encoding !== 'geoarrow.geometrycollection'
  ) {
    return null;
  }

  const bounds: (GeoArrowBounds | null)[] = [];
  for (const data of column.data) {
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      if (!isValidDataRow(data, rowIndex)) {
        bounds.push(null);
        continue;
      }
      const accumulator: MutableBounds = createEmptyBounds();
      const valid =
        encoding === 'geoarrow.box'
          ? collectBoxBounds(data, rowIndex, accumulator)
          : collectNativeBounds(data, rowIndex, rowIndex + 1, accumulator);
      bounds.push(valid ? toGeoArrowBounds(accumulator) : null);
    }
  }
  return bounds;
}

type MutableBounds = {
  minimumX: number;
  minimumY: number;
  maximumX: number;
  maximumY: number;
};

/** Recursively visits list offsets until it reaches an interleaved or separated coordinate leaf. */
function collectNativeBounds(
  data: arrow.Data,
  startIndex: number,
  endIndex: number,
  bounds: MutableBounds
): boolean {
  if (data.type instanceof arrow.DenseUnion) {
    if (!data.typeIds || !data.valueOffsets) return false;
    const useLogicalIndex = data.typeIds.length <= data.length;
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
      if (!isValidDataRow(data, rowIndex)) continue;
      const typeIdIndex = getUnionDataIndex(
        data.typeIds.length,
        data.offset,
        rowIndex,
        useLogicalIndex
      );
      const valueOffsetIndex = getUnionDataIndex(
        data.valueOffsets.length,
        data.offset,
        rowIndex,
        useLogicalIndex
      );
      const childIndex = data.type.typeIds.indexOf(data.typeIds[typeIdIndex]);
      const valueOffset = data.valueOffsets[valueOffsetIndex];
      const child = childIndex >= 0 ? data.children[childIndex] : undefined;
      if (!child || valueOffset < 0 || valueOffset >= child.length) return false;
      if (!collectNativeBounds(child, valueOffset, valueOffset + 1, bounds)) return false;
    }
    return true;
  }

  if (data.type instanceof arrow.List || data.type instanceof arrow.LargeList) {
    const offsets = data.valueOffsets;
    const child = data.children[0];
    if (!offsets || !child) return false;
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
      if (!isValidDataRow(data, rowIndex)) continue;
      const childStart = Number(
        offsets[getDataBufferIndex(offsets.length, data.offset, rowIndex, data.length)]
      );
      const childEnd = Number(
        offsets[getDataBufferIndex(offsets.length, data.offset, rowIndex + 1, data.length)]
      );
      if (!Number.isSafeInteger(childStart) || !Number.isSafeInteger(childEnd)) return false;
      if (!collectNativeBounds(child, childStart, childEnd, bounds)) return false;
    }
    return true;
  }

  if (data.type instanceof arrow.FixedSizeList) {
    const coordinateSize = data.type.listSize;
    const child = data.children[0];
    const values = child?.values;
    if (!child || !values || coordinateSize < 2 || coordinateSize > 4) return false;
    for (let coordinateIndex = startIndex; coordinateIndex < endIndex; coordinateIndex++) {
      const valueIndex = coordinateIndex * coordinateSize;
      updateNativeBounds(
        bounds,
        readDataValue(values, child, valueIndex),
        readDataValue(values, child, valueIndex + 1)
      );
    }
    return true;
  }

  if (data.type instanceof arrow.Struct) {
    const xIndex = data.type.children.findIndex(field => field.name === 'x');
    const yIndex = data.type.children.findIndex(field => field.name === 'y');
    const xValues = xIndex >= 0 ? data.children[xIndex]?.values : undefined;
    const yValues = yIndex >= 0 ? data.children[yIndex]?.values : undefined;
    if (xIndex < 0 || yIndex < 0 || !xValues || !yValues) return false;
    for (let coordinateIndex = startIndex; coordinateIndex < endIndex; coordinateIndex++) {
      const xChild = data.children[xIndex];
      const yChild = data.children[yIndex];
      updateNativeBounds(
        bounds,
        readDataValue(xValues, xChild, coordinateIndex),
        readDataValue(yValues, yChild, coordinateIndex)
      );
    }
    return true;
  }

  return false;
}

/** Reads one separated GeoArrow box row directly from its struct children. */
function collectBoxBounds(data: arrow.Data, rowIndex: number, bounds: MutableBounds): boolean {
  if (!(data.type instanceof arrow.Struct)) return false;
  const fieldValues = new Map(
    data.type.children.map((field, childIndex) => [field.name, data.children[childIndex]])
  );
  const minimumX = readNativeChildValue(fieldValues.get('xmin'), rowIndex);
  const minimumY = readNativeChildValue(fieldValues.get('ymin'), rowIndex);
  const maximumX = readNativeChildValue(fieldValues.get('xmax'), rowIndex);
  const maximumY = readNativeChildValue(fieldValues.get('ymax'), rowIndex);
  if (![minimumX, minimumY, maximumX, maximumY].every(Number.isFinite)) return false;
  bounds.minimumX = minimumX!;
  bounds.minimumY = minimumY!;
  bounds.maximumX = maximumX!;
  bounds.maximumY = maximumY!;
  return true;
}

/** Reads one scalar child value while accounting for sliced Arrow child data. */
function readNativeChildValue(child: arrow.Data | undefined, rowIndex: number): number | undefined {
  const values = child?.values;
  if (!child || !values) return undefined;
  return readDataValue(values, child, rowIndex);
}

/** Reads a value from either a full Arrow backing buffer or a sliced view. */
function readDataValue(values: ArrayLike<number>, data: arrow.Data, index: number): number {
  const offsetIndex = data.offset + index;
  return Number(values[offsetIndex < values.length ? offsetIndex : index]);
}

/** Resolves a dense-union buffer index for full and sliced Arrow union data. */
function getUnionDataIndex(
  bufferLength: number,
  offset: number,
  rowIndex: number,
  useLogicalIndex: boolean
): number {
  if (useLogicalIndex) return rowIndex;
  const physicalIndex = offset + rowIndex;
  return physicalIndex < bufferLength ? physicalIndex : rowIndex;
}

/** Resolves a list-offset buffer index for full and shortened sliced data. */
function getDataBufferIndex(
  bufferLength: number,
  offset: number,
  rowIndex: number,
  dataLength: number
): number {
  if (bufferLength <= dataLength + 1) return rowIndex;
  const physicalIndex = offset + rowIndex;
  return physicalIndex < bufferLength ? physicalIndex : rowIndex;
}

/** Tests a top-level or nested Arrow validity bitmap using a logical row index. */
function isValidDataRow(data: arrow.Data, rowIndex: number): boolean {
  if (data.nullCount === 0) return true;
  const nullBitmap = data.nullBitmap;
  return (
    Boolean(nullBitmap && nullBitmap.length > 0) &&
    (nullBitmap[(data.offset + rowIndex) >> 3] & (1 << ((data.offset + rowIndex) & 7))) !== 0
  );
}

/** Creates an empty mutable bounds accumulator. */
function createEmptyBounds(): MutableBounds {
  return {
    minimumX: Number.POSITIVE_INFINITY,
    minimumY: Number.POSITIVE_INFINITY,
    maximumX: Number.NEGATIVE_INFINITY,
    maximumY: Number.NEGATIVE_INFINITY
  };
}

/** Updates horizontal bounds for finite coordinate values. */
function updateNativeBounds(bounds: MutableBounds, x: number, y: number): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  bounds.minimumX = Math.min(bounds.minimumX, x);
  bounds.minimumY = Math.min(bounds.minimumY, y);
  bounds.maximumX = Math.max(bounds.maximumX, x);
  bounds.maximumY = Math.max(bounds.maximumY, y);
}

/** Converts an accumulator into the public nullable bounds representation. */
function toGeoArrowBounds(bounds: MutableBounds): GeoArrowBounds | null {
  return Number.isFinite(bounds.minimumX) && Number.isFinite(bounds.minimumY)
    ? [bounds.minimumX, bounds.minimumY, bounds.maximumX, bounds.maximumY]
    : null;
}

/**
 * Computes exact XY bounds for one GeoArrow geometry cell.
 *
 * WKB uses the existing binary scanner; native encodings walk Arrow vectors and coordinate
 * buffers directly. The function is deliberately tolerant of null and empty geometries.
 *
 * @param value GeoArrow cell value.
 * @param encoding GeoArrow encoding declared for the cell.
 * @returns Bounds or `null` when the cell has no finite XY coordinate.
 */
export function getGeoArrowBounds(
  value: unknown,
  encoding: GeoArrowEncoding
): GeoArrowBounds | null {
  if (value == null) return null;
  if (encoding === 'geoarrow.wkb') {
    const bytes = value as Uint8Array;
    const statistics = getWKBGeometryStatistics(bytes);
    return statistics.bbox
      ? [statistics.bbox.xmin, statistics.bbox.ymin, statistics.bbox.xmax, statistics.bbox.ymax]
      : null;
  }
  if (encoding === 'geoarrow.box' && isBoxValue(value)) {
    return [value.xmin, value.ymin, value.xmax, value.ymax];
  }
  const accumulator: [number, number, number, number] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ];
  visitCoordinates(value, accumulator);
  return Number.isFinite(accumulator[0]) ? accumulator : null;
}

function visitCoordinates(value: unknown, bounds: [number, number, number, number]): void {
  if (value == null) return;
  const coordinate = getCoordinate(value);
  if (coordinate) {
    updateBounds(bounds, coordinate[0], coordinate[1]);
    return;
  }
  if (isVectorLike(value)) {
    for (let index = 0; index < value.length; index++) visitCoordinates(value.get(index), bounds);
    return;
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    for (const child of Array.from(value as ArrayLike<unknown>)) visitCoordinates(child, bounds);
  }
}

function getCoordinate(value: unknown): [number, number] | null {
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const record = value as {x: unknown; y: unknown};
    return typeof record.x === 'number' && typeof record.y === 'number'
      ? [record.x, record.y]
      : null;
  }
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    const coordinate = (value as {toArray(): ArrayLike<unknown>}).toArray();
    return getNumericCoordinate(coordinate);
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return getNumericCoordinate(value as ArrayLike<unknown>);
  }
  return null;
}

function isBoxValue(
  value: unknown
): value is {xmin: number; ymin: number; xmax: number; ymax: number} {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as {xmin?: unknown}).xmin === 'number' &&
      typeof (value as {ymin?: unknown}).ymin === 'number' &&
      typeof (value as {xmax?: unknown}).xmax === 'number' &&
      typeof (value as {ymax?: unknown}).ymax === 'number'
  );
}

function getNumericCoordinate(value: ArrayLike<unknown>): [number, number] | null {
  return typeof value[0] === 'number' && typeof value[1] === 'number' ? [value[0], value[1]] : null;
}

function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}

function updateBounds(bounds: [number, number, number, number], x: number, y: number): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  bounds[0] = Math.min(bounds[0], x);
  bounds[1] = Math.min(bounds[1], y);
  bounds[2] = Math.max(bounds[2], x);
  bounds[3] = Math.max(bounds[3], y);
}
