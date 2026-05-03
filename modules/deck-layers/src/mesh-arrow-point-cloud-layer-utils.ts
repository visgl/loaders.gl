// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {ArrowTableBatch, MeshArrowTable} from '@loaders.gl/schema';

/** Data accepted by MeshArrowPointCloudLayer. */
export type MeshArrowPointCloudData =
  | MeshArrowTable
  | arrow.Table
  | AsyncIterable<ArrowTableBatch>
  | null;

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
 * Returns an Apache Arrow table from supported non-streaming layer data.
 * @param data Mesh Arrow table wrapper or raw Apache Arrow table.
 * @returns Apache Arrow table.
 */
export function getArrowTable(
  data: MeshArrowTable | arrow.Table | AsyncIterable<ArrowTableBatch>
): arrow.Table {
  return isMeshArrowTable(data) ? data.data : (data as arrow.Table);
}

/**
 * Checks whether layer data is a loaders.gl Arrow table wrapper.
 * @param data Value to test.
 * @returns `true` when the value is a Mesh Arrow table wrapper.
 */
export function isMeshArrowTable(data: unknown): data is MeshArrowTable {
  return (data as MeshArrowTable).shape === 'arrow-table';
}

/**
 * Returns true when data can be consumed as async Arrow table batches.
 * @param data Value to test.
 * @returns `true` when the value is async iterable.
 */
export function isAsyncIterable(data: unknown): data is AsyncIterable<ArrowTableBatch> {
  return Boolean(
    data && typeof (data as AsyncIterable<ArrowTableBatch>)[Symbol.asyncIterator] === 'function'
  );
}

/**
 * Returns true when a value is a loaders.gl Arrow table data batch.
 * @param data Value to test.
 * @returns `true` when the value is an Arrow table batch.
 */
export function isArrowTableBatch(data: unknown): data is ArrowTableBatch {
  const arrowTableBatch = data as ArrowTableBatch;
  return (
    arrowTableBatch?.shape === 'arrow-table' &&
    arrowTableBatch.batchType === 'data' &&
    isArrowTable(arrowTableBatch.data)
  );
}

/**
 * Returns true when a value is an Apache Arrow table.
 * @param data Value to test.
 * @returns `true` when the value behaves like an Apache Arrow table.
 */
export function isArrowTable(data: unknown): data is arrow.Table {
  return Boolean(data && typeof (data as arrow.Table).getChild === 'function');
}
