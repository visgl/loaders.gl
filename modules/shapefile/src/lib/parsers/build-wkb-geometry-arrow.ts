// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, Schema as TableSchema} from '@loaders.gl/schema';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {type CoordinateTransform, reprojectWKBInPlace} from '@loaders.gl/gis';

export type SHPWKBGeometry = Uint8Array;

/** Creates an Arrow table containing one WKB geometry column. */
export function makeWKBGeometryArrowTable(
  geometries: (SHPWKBGeometry | null | undefined)[],
  schema: TableSchema,
  transform?: CoordinateTransform
): ArrowTable {
  const arrowSchema = convertSchemaToArrow(schema);
  const geometryData = makeWKBGeometryData(geometries, transform);
  const structField = new arrow.Struct(arrowSchema.fields);
  const structData = new arrow.Data(structField, 0, geometries.length, 0, undefined, [
    geometryData
  ]);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [recordBatch])
  };
}

/** Creates Arrow Binary buffers containing WKB geometries. */
export function makeWKBGeometryData(
  geometries: (SHPWKBGeometry | null | undefined)[],
  transform?: CoordinateTransform
): arrow.Data<arrow.Binary> {
  const valueOffsets = measureWKBGeometryOffsets(geometries);
  const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
  const {nullBitmap, nullCount} = writeWKBGeometryValues(
    geometries,
    valueOffsets,
    values,
    transform
  );

  return new arrow.Data(new arrow.Binary(), 0, geometries.length, nullCount, [
    valueOffsets,
    values,
    nullCount > 0 ? nullBitmap : undefined
  ]);
}

function measureWKBGeometryOffsets(geometries: (SHPWKBGeometry | null | undefined)[]): Int32Array {
  const valueOffsets = new Int32Array(geometries.length + 1);
  for (let geometryIndex = 0; geometryIndex < geometries.length; geometryIndex++) {
    const geometry = geometries[geometryIndex];
    if (!geometry) {
      valueOffsets[geometryIndex + 1] = valueOffsets[geometryIndex];
      continue;
    }

    valueOffsets[geometryIndex + 1] = valueOffsets[geometryIndex] + geometry.byteLength;
  }
  return valueOffsets;
}

function writeWKBGeometryValues(
  geometries: (SHPWKBGeometry | null | undefined)[],
  valueOffsets: Int32Array,
  values: Uint8Array,
  transform?: CoordinateTransform
): {nullBitmap: Uint8Array; nullCount: number} {
  const nullBitmap = new Uint8Array(Math.ceil(geometries.length / 8));
  let nullCount = 0;

  for (let geometryIndex = 0; geometryIndex < geometries.length; geometryIndex++) {
    const geometry = geometries[geometryIndex];
    if (!geometry) {
      nullCount++;
      continue;
    }

    nullBitmap[geometryIndex >> 3] |= 1 << (geometryIndex & 7);
    const startOffset = valueOffsets[geometryIndex];
    const endOffset = valueOffsets[geometryIndex + 1];
    values.set(geometry, startOffset);
    if (transform) {
      reprojectWKBInPlace(values.subarray(startOffset, endOffset), transform);
    }
  }

  return {nullBitmap, nullCount};
}
