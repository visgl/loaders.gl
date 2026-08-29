// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {parseWKBHeader} from '@loaders.gl/gis';
import type {GeoArrowOffsetType} from '@loaders.gl/schema';

/**
 * Decodes a WKB LineString vector directly into native Arrow coordinate and offset buffers.
 *
 * @param column WKB Arrow vector.
 * @param coordinateSize Number of output ordinates per coordinate.
 * @param offsetType Width of the output list offsets.
 * @returns Native GeoArrow LineString vector.
 */
export function decodeWKBLineStringVector(
  column: arrow.Vector,
  coordinateSize: 2 | 3 | 4,
  offsetType: GeoArrowOffsetType = 'int32'
): arrow.Vector {
  const pointCounts = new Array<number>(column.length).fill(0);
  let pointCount = 0;
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      nullCount++;
      continue;
    }
    const dataView = getDataView(value as Uint8Array);
    const header = parseWKBHeader(dataView);
    if (header.geometryType !== 2) {
      throw new Error(`WKB LineString kernel received geometry type ${header.geometryType}.`);
    }
    if (header.dimensions !== coordinateSize) {
      throw new Error(
        `WKB LineString dimension ${header.dimensions} does not match destination dimension ${coordinateSize}.`
      );
    }
    const currentPointCount = dataView.getUint32(header.byteOffset, header.littleEndian);
    pointCounts[rowIndex] = currentPointCount;
    pointCount += currentPointCount;
  }

  const coordinates = new Float64Array(pointCount * coordinateSize);
  const offsets = createOffsets(column.length + 1, offsetType);
  let coordinateIndex = 0;
  let offsetIndex = 0;
  const nullBitmap = new Uint8Array(Math.ceil(column.length / 8));

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      setOffset(offsets, ++offsetIndex, coordinateIndex);
      continue;
    }
    const dataView = getDataView(value as Uint8Array);
    const header = parseWKBHeader(dataView);
    let byteOffset = header.byteOffset + 4;
    for (let pointIndex = 0; pointIndex < pointCounts[rowIndex]; pointIndex++) {
      for (let dimensionIndex = 0; dimensionIndex < coordinateSize; dimensionIndex++) {
        if (byteOffset + 8 > dataView.byteLength) {
          throw new Error(`WKB LineString row ${rowIndex} is truncated.`);
        }
        coordinates[coordinateIndex++] = dataView.getFloat64(byteOffset, header.littleEndian);
        byteOffset += 8;
      }
    }
    setOffset(offsets, ++offsetIndex, coordinateIndex / coordinateSize);
    nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
  }

  const coordinateType = new arrow.FixedSizeList(
    coordinateSize,
    new arrow.Field('value', new arrow.Float64(), false)
  );
  const child = arrow.makeData({type: new arrow.Float64(), data: coordinates} as any);
  const coordinateData = arrow.makeData({type: coordinateType, child} as any);
  const listType =
    offsetType === 'int64'
      ? new arrow.LargeList(new arrow.Field('vertices', coordinateType, false))
      : new arrow.List(new arrow.Field('vertices', coordinateType, false));
  const data = arrow.makeData({
    type: listType,
    length: column.length,
    nullCount,
    nullBitmap: nullCount > 0 ? nullBitmap : undefined,
    valueOffsets: offsets,
    child: coordinateData
  } as any);
  return arrow.makeVector(data);
}

function getDataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function createOffsets(length: number, offsetType: GeoArrowOffsetType): Int32Array | BigInt64Array {
  return offsetType === 'int64' ? new BigInt64Array(length) : new Int32Array(length);
}

function setOffset(offsets: Int32Array | BigInt64Array, index: number, value: number): void {
  if (offsets instanceof BigInt64Array) offsets[index] = BigInt(value);
  else offsets[index] = value;
}
