// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
/** Data accepted by MeshArrowPointCloudLayer. */
export type MeshArrowPointCloudData = arrow.Table | AsyncIterable<arrow.RecordBatch> | null;

/**
 * Returns the async batch index encoded in a rendered sublayer id.
 * @param layerId Rendered sublayer id.
 * @returns Decoded batch index, defaulting to zero.
 */
export function getBatchIndexFromLayerId(layerId: string | undefined): number {
  const batchIndexText = layerId?.match(/points-(\d+)$/)?.[1];
  return batchIndexText ? Number(batchIndexText) : 0;
}

/**
 * Reads all column values for one Arrow table row.
 * @param table Arrow table to read.
 * @param rowIndex Row index.
 * @returns Serializable row properties keyed by Arrow column name.
 */
export function getArrowTableRowProperties(
  table: arrow.Table,
  rowIndex: number
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const field of table.schema.fields) {
    const vector = table.getChild(field.name);
    if (vector) {
      properties[field.name] = getSerializableArrowValue(vector.get(rowIndex));
    }
  }
  return properties;
}

/**
 * Converts Arrow vector values into values suitable for tooltip rendering.
 * @param value Arrow vector value.
 * @returns Serializable value.
 */
export function getSerializableArrowValue(value: unknown): unknown {
  if (ArrayBuffer.isView(value)) {
    return value instanceof DataView
      ? Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      : Array.from(value as unknown as ArrayLike<unknown>);
  }
  if (Array.isArray(value)) {
    return value.map(getSerializableArrowValue);
  }
  if (value && typeof value === 'object' && Symbol.iterator in value) {
    return Array.from(value as Iterable<unknown>).map(getSerializableArrowValue);
  }
  return value;
}

/**
 * Returns true when data can be consumed as async Arrow table batches.
 * @param data Value to test.
 * @returns `true` when the value is async iterable.
 */
export function isAsyncIterable(data: unknown): data is AsyncIterable<arrow.RecordBatch> {
  return Boolean(
    data && typeof (data as AsyncIterable<arrow.RecordBatch>)[Symbol.asyncIterator] === 'function'
  );
}
