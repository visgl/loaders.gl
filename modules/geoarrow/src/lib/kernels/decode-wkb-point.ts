// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {parseWKBHeader} from '@loaders.gl/gis';

/**
 * Decodes a WKB point vector directly into one interleaved Float64 Arrow buffer.
 *
 * This kernel intentionally does not construct GeoJSON objects or coordinate arrays. It accepts
 * mixed WKB dimensional headers and writes into the requested fixed-width destination.
 *
 * @param column WKB Arrow vector.
 * @param coordinateSize Number of output ordinates per point.
 * @returns Native GeoArrow point vector.
 */
export function decodeWKBPointVector(
  column: arrow.Vector,
  coordinateSize: 2 | 3 | 4
): arrow.Vector<arrow.FixedSizeList> {
  const coordinates = new Float64Array(column.length * coordinateSize);
  const nullBitmap = new Uint8Array(Math.ceil(column.length / 8));
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      nullCount++;
      continue;
    }
    const bytes = value as Uint8Array;
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const header = parseWKBHeader(dataView);
    if (header.geometryType !== 1) {
      throw new Error(`WKB point kernel received geometry type ${header.geometryType}.`);
    }
    const sourceDimension = header.dimensions;
    if (sourceDimension !== coordinateSize) {
      throw new Error(
        `WKB point dimension ${sourceDimension} does not match destination dimension ${coordinateSize}.`
      );
    }
    const coordinateOffset = rowIndex * coordinateSize;
    for (let dimensionIndex = 0; dimensionIndex < coordinateSize; dimensionIndex++) {
      const byteOffset = header.byteOffset + dimensionIndex * 8;
      if (byteOffset + 8 > dataView.byteLength) {
        throw new Error(`WKB point row ${rowIndex} is truncated.`);
      }
      coordinates[coordinateOffset + dimensionIndex] = dataView.getFloat64(
        byteOffset,
        header.littleEndian
      );
    }
    nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
  }

  const coordinateType = new arrow.FixedSizeList(
    coordinateSize,
    new arrow.Field('value', new arrow.Float64(), false)
  );
  const child = arrow.makeData({type: new arrow.Float64(), data: coordinates} as any);
  const data = arrow.makeData({
    type: coordinateType,
    length: column.length,
    nullCount,
    nullBitmap: nullCount > 0 ? nullBitmap : undefined,
    child
  } as any);
  return arrow.makeVector(data) as unknown as arrow.Vector<arrow.FixedSizeList>;
}
