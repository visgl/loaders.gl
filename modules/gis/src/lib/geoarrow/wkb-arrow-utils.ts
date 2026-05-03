// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, Schema as TableSchema} from '@loaders.gl/schema';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {
  reprojectWKBInPlace,
  type CoordinateTransform
} from '../geometry-converters/wkb/convert-binary-geometry-to-wkb';
import {
  WKBBuilder,
  type WKBBuilderBaseOptions,
  type WKBGeometryArray,
  type WKBGeometryWriter
} from '../geometry-converters/wkb/wkb-builder';

/** WKB bytes accepted by shared GeoArrow WKB builders. */
export type WKBGeometryValue = ArrayBuffer | ArrayBufferView | Uint8Array;

/** Options for creating Arrow WKB buffers from existing WKB byte values. */
export type WKBArrowGeometryValueOptions = {
  /** Optional coordinate transform applied in-place after copying each WKB value. */
  transform?: CoordinateTransform;
};

/** Options for creating Arrow WKB buffers from incremental writer callbacks. */
export type WKBArrowGeometryWriterOptions = WKBBuilderBaseOptions;

/**
 * Creates a loaders.gl Arrow table containing one `geoarrow.wkb` geometry column.
 *
 * @param geometries - WKB geometry byte values, with nullish values encoded as null rows.
 * @param schema - Table schema containing the WKB geometry field.
 * @param options - WKB value options.
 * @returns Arrow table with one WKB geometry column.
 */
export function makeWKBGeometryArrowTable(
  geometries: (WKBGeometryValue | null | undefined)[],
  schema: TableSchema,
  options: WKBArrowGeometryValueOptions = {}
): ArrowTable {
  return makeWKBGeometryArrowTableFromData(schema, makeWKBGeometryData(geometries, options));
}

/**
 * Creates a loaders.gl Arrow table from incremental WKB writer callbacks.
 *
 * @param geometryWriters - Writer callbacks, with nullish values encoded as null rows.
 * @param schema - Table schema containing the WKB geometry field.
 * @param options - WKB writer options.
 * @returns Arrow table with one WKB geometry column.
 */
export function makeWKBGeometryArrowTableFromWriters(
  geometryWriters: (WKBGeometryWriter | null | undefined)[],
  schema: TableSchema,
  options: WKBArrowGeometryWriterOptions = {}
): ArrowTable {
  return makeWKBGeometryArrowTableFromData(
    schema,
    makeWKBGeometryDataFromWriters(geometryWriters, options)
  );
}

/**
 * Wraps Arrow WKB geometry data in a loaders.gl Arrow table.
 *
 * @param schema - Table schema containing the WKB geometry field.
 * @param geometryData - Arrow Binary data for the WKB geometry column.
 * @returns Arrow table with one WKB geometry column.
 */
export function makeWKBGeometryArrowTableFromData(
  schema: TableSchema,
  geometryData: arrow.Data<arrow.Binary>
): ArrowTable {
  const arrowSchema = convertSchemaToArrow(schema);
  const structField = new arrow.Struct(arrowSchema.fields);
  const structData = new arrow.Data(structField, 0, geometryData.length, 0, undefined, [
    geometryData
  ]);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [recordBatch])
  };
}

/**
 * Creates Arrow Binary buffers containing WKB geometries.
 *
 * @param geometries - WKB geometry byte values, with nullish values encoded as null rows.
 * @param options - WKB value options.
 * @returns Arrow Binary data for one `geoarrow.wkb` column.
 */
export function makeWKBGeometryData(
  geometries: (WKBGeometryValue | null | undefined)[],
  options: WKBArrowGeometryValueOptions = {}
): arrow.Data<arrow.Binary> {
  const valueOffsets = measureWKBGeometryOffsets(geometries);
  const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
  const {nullBitmap, nullCount} = writeWKBGeometryValues(geometries, valueOffsets, values, options);

  return makeWKBGeometryDataFromArray({valueOffsets, values, nullBitmap, nullCount});
}

/**
 * Creates Arrow Binary buffers from incremental WKB writer callbacks.
 *
 * @param geometryWriters - Writer callbacks, with nullish values encoded as null rows.
 * @param options - WKB writer options.
 * @returns Arrow Binary data for one `geoarrow.wkb` column.
 */
export function makeWKBGeometryDataFromWriters(
  geometryWriters: (WKBGeometryWriter | null | undefined)[],
  options: WKBArrowGeometryWriterOptions = {}
): arrow.Data<arrow.Binary> {
  return makeWKBGeometryDataFromArray(
    WKBBuilder.buildGeometryArray(normalizeGeometryWriters(geometryWriters), options)
  );
}

/**
 * Wraps prebuilt WKB offsets, values and null buffers as Arrow Binary data.
 *
 * @param geometryArray - WKB geometry array buffers.
 * @returns Arrow Binary data for one `geoarrow.wkb` column.
 */
export function makeWKBGeometryDataFromArray(
  geometryArray: WKBGeometryArray
): arrow.Data<arrow.Binary> {
  return new arrow.Data(
    new arrow.Binary(),
    0,
    geometryArray.valueOffsets.length - 1,
    geometryArray.nullCount,
    [
      geometryArray.valueOffsets,
      geometryArray.values,
      geometryArray.nullCount > 0 ? geometryArray.nullBitmap : undefined
    ]
  );
}

function measureWKBGeometryOffsets(
  geometries: (WKBGeometryValue | null | undefined)[]
): Int32Array {
  const valueOffsets = new Int32Array(geometries.length + 1);
  for (let geometryIndex = 0; geometryIndex < geometries.length; geometryIndex++) {
    const geometry = geometries[geometryIndex];
    valueOffsets[geometryIndex + 1] =
      valueOffsets[geometryIndex] + (geometry ? getWKBGeometryByteLength(geometry) : 0);
  }
  return valueOffsets;
}

function writeWKBGeometryValues(
  geometries: (WKBGeometryValue | null | undefined)[],
  valueOffsets: Int32Array,
  values: Uint8Array,
  options: WKBArrowGeometryValueOptions
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
    values.set(getWKBGeometryBytes(geometry), startOffset);
    if (options.transform) {
      reprojectWKBInPlace(values.subarray(startOffset, endOffset), options.transform);
    }
  }

  return {nullBitmap, nullCount};
}

function getWKBGeometryByteLength(geometry: WKBGeometryValue): number {
  return geometry instanceof ArrayBuffer ? geometry.byteLength : geometry.byteLength;
}

function getWKBGeometryBytes(geometry: WKBGeometryValue): Uint8Array {
  if (geometry instanceof Uint8Array) {
    return geometry;
  }
  if (geometry instanceof ArrayBuffer) {
    return new Uint8Array(geometry);
  }
  return new Uint8Array(geometry.buffer, geometry.byteOffset, geometry.byteLength);
}

function normalizeGeometryWriters(
  geometryWriters: (WKBGeometryWriter | null | undefined)[]
): (WKBGeometryWriter | null)[] {
  return geometryWriters.map(geometryWriter => geometryWriter || null);
}
