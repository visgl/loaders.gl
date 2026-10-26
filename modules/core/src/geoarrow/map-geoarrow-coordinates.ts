// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Callback used to transform one complete GeoArrow coordinate tuple. */
export type GeoArrowCoordinateMapper = (coordinate: readonly number[]) => readonly number[];

/**
 * Maps native GeoArrow coordinates directly in their Arrow buffers.
 *
 * The operation is intentionally in-place: Arrow vectors may share buffers, so callers that need
 * isolation must pass a copied vector. Nested lists, dense unions, interleaved fixed-size lists,
 * and separated coordinate structs are traversed without creating per-feature objects.
 *
 * @param column Native GeoArrow vector.
 * @param mapper Coordinate transformation callback.
 * @returns The same vector after its coordinate buffers are updated.
 */
export function mapGeoArrowCoordinates(
  column: arrow.Vector,
  mapper: GeoArrowCoordinateMapper
): arrow.Vector {
  for (const data of column.data) {
    mapDataCoordinates(data, mapper);
  }
  return column;
}

type MutableArrowData = {
  type: arrow.DataType;
  children: MutableArrowData[];
  valueOffsets?: ArrayLike<number | bigint>;
  typeIds?: ArrayLike<number>;
  values?: ArrayLike<number> & {[index: number]: number};
  offset: number;
  length: number;
};

function mapDataCoordinates(data: arrow.Data, mapper: GeoArrowCoordinateMapper): void {
  mapDataCoordinateRanges(data, mapper);
}

type CoordinateRange = readonly [number, number];

function mapDataCoordinateRanges(
  data: arrow.Data,
  mapper: GeoArrowCoordinateMapper,
  ranges?: readonly CoordinateRange[]
): void {
  const mutableData = data as unknown as MutableArrowData;
  const {type} = mutableData;
  if (type instanceof arrow.FixedSizeList && isNumericData(mutableData.children[0])) {
    mapInterleavedCoordinates(mutableData, type.listSize, mapper, ranges);
    return;
  }
  if (type instanceof arrow.Struct && isCoordinateStruct(type)) {
    mapSeparatedCoordinates(mutableData, type, mapper, ranges);
    return;
  }

  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    const child = mutableData.children[0];
    const valueOffsets = mutableData.valueOffsets;
    if (!child || !valueOffsets) return;
    const childRanges: CoordinateRange[] = [];
    for (const [rangeStart, rangeEnd] of getVisibleRanges(mutableData, ranges)) {
      for (let rowIndex = rangeStart; rowIndex < rangeEnd; rowIndex++) {
        if (!isValidDataRow(mutableData, rowIndex)) continue;
        const childStart = readOffset(
          valueOffsets,
          mutableData.offset,
          rowIndex,
          mutableData.length
        );
        const childEnd = readOffset(
          valueOffsets,
          mutableData.offset,
          rowIndex + 1,
          mutableData.length
        );
        if (childStart === null || childEnd === null || childStart > childEnd) continue;
        childRanges.push([childStart, childEnd]);
      }
    }
    mapDataCoordinateRanges(child as unknown as arrow.Data, mapper, mergeRanges(childRanges));
    return;
  }

  if (type instanceof arrow.DenseUnion) {
    const typeIds = mutableData.typeIds;
    const valueOffsets = mutableData.valueOffsets;
    if (!typeIds || !valueOffsets) return;
    const childRanges = type.children.map((): CoordinateRange[] => []);
    const useLogicalIndex = typeIds.length <= mutableData.length;
    for (const [rangeStart, rangeEnd] of getVisibleRanges(mutableData, ranges)) {
      for (let rowIndex = rangeStart; rowIndex < rangeEnd; rowIndex++) {
        const typeIdIndex = getBufferIndex(
          typeIds.length,
          mutableData.offset,
          rowIndex,
          useLogicalIndex
        );
        const valueOffsetIndex = getBufferIndex(
          valueOffsets.length,
          mutableData.offset,
          rowIndex,
          useLogicalIndex
        );
        const childIndex = type.typeIds.indexOf(typeIds[typeIdIndex]);
        const valueOffset = readOffset(valueOffsets, 0, valueOffsetIndex, valueOffsets.length);
        if (childIndex >= 0 && valueOffset !== null) {
          childRanges[childIndex].push([valueOffset, valueOffset + 1]);
        }
      }
    }
    for (const [childIndex, childData] of mutableData.children.entries()) {
      mapDataCoordinateRanges(
        childData as unknown as arrow.Data,
        mapper,
        mergeRanges(childRanges[childIndex])
      );
    }
    return;
  }

  for (const child of mutableData.children) {
    mapDataCoordinateRanges(child as unknown as arrow.Data, mapper, ranges);
  }
}

function mapInterleavedCoordinates(
  data: MutableArrowData,
  coordinateSize: number,
  mapper: GeoArrowCoordinateMapper,
  ranges?: readonly CoordinateRange[]
): void {
  const childData = data.children[0];
  const values = childData.values;
  if (!values) return;
  for (const [rangeStart, rangeEnd] of getVisibleRanges(data, ranges)) {
    for (let coordinateIndex = rangeStart; coordinateIndex < rangeEnd; coordinateIndex++) {
      const logicalStart = coordinateIndex * coordinateSize;
      const valueStart = getBufferIndex(
        values.length,
        childData.offset + data.offset * coordinateSize,
        logicalStart
      );
      const coordinate = new Array<number>(coordinateSize);
      for (let dimensionIndex = 0; dimensionIndex < coordinateSize; dimensionIndex++) {
        coordinate[dimensionIndex] = values[valueStart + dimensionIndex];
      }
      writeMappedCoordinate(values, valueStart, coordinateSize, mapper(coordinate));
    }
  }
}

function mapSeparatedCoordinates(
  data: MutableArrowData,
  type: arrow.Struct,
  mapper: GeoArrowCoordinateMapper,
  ranges?: readonly CoordinateRange[]
): void {
  const coordinateChildren = type.children.map((field, childIndex) => ({
    name: field.name,
    values: data.children[childIndex]?.values,
    offset: data.children[childIndex]?.offset || 0
  }));
  if (coordinateChildren.some(child => !child.values)) return;
  for (const [rangeStart, rangeEnd] of getVisibleRanges(data, ranges)) {
    for (let rowIndex = rangeStart; rowIndex < rangeEnd; rowIndex++) {
      const coordinate = coordinateChildren.map(
        child =>
          child.values![getBufferIndex(child.values!.length, child.offset + data.offset, rowIndex)]
      );
      const mappedCoordinate = mapper(coordinate);
      for (let dimensionIndex = 0; dimensionIndex < coordinateChildren.length; dimensionIndex++) {
        coordinateChildren[dimensionIndex].values![
          getBufferIndex(
            coordinateChildren[dimensionIndex].values!.length,
            coordinateChildren[dimensionIndex].offset + data.offset,
            rowIndex
          )
        ] = mappedCoordinate[dimensionIndex];
      }
    }
  }
}

/** Resolves a numeric buffer index for both full backing buffers and shortened sliced views. */
function getBufferIndex(
  bufferLength: number,
  offset: number,
  logicalIndex: number,
  useLogicalIndex = false
): number {
  if (useLogicalIndex) return logicalIndex;
  const physicalIndex = offset + logicalIndex;
  return physicalIndex < bufferLength ? physicalIndex : logicalIndex;
}

/** Returns visible row ranges for a sliced or full Arrow data node. */
function getVisibleRanges(
  data: MutableArrowData,
  ranges?: readonly CoordinateRange[]
): readonly CoordinateRange[] {
  return (ranges || [[0, data.length]])
    .map(
      ([rangeStart, rangeEnd]) =>
        [Math.max(0, rangeStart), Math.min(data.length, rangeEnd)] as const
    )
    .filter(([rangeStart, rangeEnd]) => rangeStart < rangeEnd);
}

/** Reads a list or union offset from a full or shortened Arrow buffer. */
function readOffset(
  offsets: ArrayLike<number | bigint>,
  offset: number,
  logicalIndex: number,
  dataLength: number
): number | null {
  const useLogicalIndex = offsets.length <= dataLength + 1;
  const bufferIndex = getBufferIndex(offsets.length, offset, logicalIndex, useLogicalIndex);
  const value = offsets[bufferIndex];
  const numericValue = typeof value === 'bigint' ? Number(value) : Number(value);
  return Number.isSafeInteger(numericValue) && numericValue >= 0 ? numericValue : null;
}

/** Merges overlapping ranges so a shared native value is mapped exactly once. */
function mergeRanges(ranges: readonly CoordinateRange[]): CoordinateRange[] {
  if (ranges.length < 2) return [...ranges];
  const sortedRanges = [...ranges].sort((left, right) => left[0] - right[0]);
  const mergedRanges: CoordinateRange[] = [sortedRanges[0]];
  for (const [rangeStart, rangeEnd] of sortedRanges.slice(1)) {
    const previousRange = mergedRanges[mergedRanges.length - 1];
    if (rangeStart <= previousRange[1]) {
      mergedRanges[mergedRanges.length - 1] = [
        previousRange[0],
        Math.max(previousRange[1], rangeEnd)
      ];
    } else {
      mergedRanges.push([rangeStart, rangeEnd]);
    }
  }
  return mergedRanges;
}

/** Tests one logical row against an Arrow validity bitmap. */
function isValidDataRow(data: MutableArrowData, rowIndex: number): boolean {
  if ((data as unknown as arrow.Data).nullCount === 0) return true;
  const nullBitmap = (data as unknown as arrow.Data).nullBitmap;
  const bitIndex = data.offset + rowIndex;
  return Boolean(nullBitmap && (nullBitmap[bitIndex >> 3] & (1 << (bitIndex & 7))) !== 0);
}

function writeMappedCoordinate(
  values: ArrayLike<number> & {[index: number]: number},
  offset: number,
  coordinateSize: number,
  mappedCoordinate: readonly number[]
): void {
  if (mappedCoordinate.length !== coordinateSize) {
    throw new Error(
      `GeoArrow coordinate mapper returned ${mappedCoordinate.length} values for a ${coordinateSize}-value coordinate.`
    );
  }
  for (let dimensionIndex = 0; dimensionIndex < coordinateSize; dimensionIndex++) {
    values[offset + dimensionIndex] = mappedCoordinate[dimensionIndex];
  }
}

function isNumericData(data: MutableArrowData | undefined): data is MutableArrowData & {
  values: ArrayLike<number> & {[index: number]: number};
} {
  return Boolean(data?.values);
}

function isCoordinateStruct(type: arrow.Struct): boolean {
  const names = new Set(type.children.map(field => field.name));
  return names.has('x') && names.has('y') && type.children.length >= 2 && type.children.length <= 4;
}
