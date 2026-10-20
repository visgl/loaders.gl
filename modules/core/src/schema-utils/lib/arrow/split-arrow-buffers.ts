// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';

/** Arrow JS typed array used in Arrow internal buffer slots. */
type ArrowTypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/** Arrow JS object shapes supported by splitArrowBuffers. */
export type SplitArrowBuffersInput =
  | arrow.Table
  | arrow.RecordBatch
  | arrow.Vector
  | arrow.Data<arrow.DataType>;

/** Options for splitArrowBuffers. */
export type SplitArrowBuffersOptions = {
  /**
   * Buffer copy mode.
   * - 'none': do not copy any typed arrays.
   * - 'sliced': copy only typed arrays that view a larger ArrayBuffer.
   * - 'all': copy every Arrow internal typed array.
   */
  copy?: 'none' | 'sliced' | 'all';
};

/**
 * Rebuilds an Arrow object so sliced internal typed-array buffers are split into standalone
 * ArrayBuffers, while whole-buffer typed arrays are reused by default.
 * @param input Arrow table, record batch, vector, or data node to rebuild.
 * @param options Buffer splitting options.
 * @returns A real Arrow object of the same kind with transfer-safe internal buffers.
 */
export function splitArrowBuffers<T extends arrow.TypeMap>(
  input: arrow.Table<T>,
  options?: SplitArrowBuffersOptions
): arrow.Table<T>;
export function splitArrowBuffers<T extends arrow.TypeMap>(
  input: arrow.RecordBatch<T>,
  options?: SplitArrowBuffersOptions
): arrow.RecordBatch<T>;
export function splitArrowBuffers<T extends arrow.DataType>(
  input: arrow.Vector<T>,
  options?: SplitArrowBuffersOptions
): arrow.Vector<T>;
export function splitArrowBuffers<T extends arrow.DataType>(
  input: arrow.Data<T>,
  options?: SplitArrowBuffersOptions
): arrow.Data<T>;
export function splitArrowBuffers<T extends SplitArrowBuffersInput>(
  input: T,
  options: SplitArrowBuffersOptions = {}
): T {
  if (isArrowTable(input)) {
    return splitArrowTableBuffersInternal(input, options) as T;
  }

  if (isArrowRecordBatch(input)) {
    return splitArrowRecordBatchBuffers(input, options) as T;
  }

  if (isArrowVector(input)) {
    return splitArrowVectorBuffers(input, options) as T;
  }

  return splitArrowDataBuffers(input, options) as T;
}

/**
 * Rebuilds an Arrow table so sliced internal typed-array buffers are split into standalone
 * ArrayBuffers, while whole-buffer typed arrays are reused by default.
 * @param table Arrow table to rebuild without mutating the original table.
 * @param options Buffer splitting options.
 * @returns A real Arrow table with transfer-safe internal buffers.
 */
export function splitArrowTableBuffers<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  options?: SplitArrowBuffersOptions
): arrow.Table<T> {
  return splitArrowTableBuffersInternal(table, options ?? {});
}

/**
 * Tests whether a value is an Arrow table.
 * @param input Value to test.
 * @returns True when the value is an Arrow table.
 */
function isArrowTable(input: SplitArrowBuffersInput): input is arrow.Table {
  return 'batches' in input;
}

/**
 * Tests whether a value is an Arrow record batch.
 * @param input Value to test.
 * @returns True when the value is an Arrow record batch.
 */
function isArrowRecordBatch(input: SplitArrowBuffersInput): input is arrow.RecordBatch {
  return 'schema' in input && 'data' in input && !Array.isArray(input.data);
}

/**
 * Tests whether a value is an Arrow vector.
 * @param input Value to test.
 * @returns True when the value is an Arrow vector.
 */
function isArrowVector(input: SplitArrowBuffersInput): input is arrow.Vector {
  return 'data' in input && Array.isArray(input.data);
}

/**
 * Rebuilds an Arrow table by rebuilding each record batch.
 * @param table Arrow table to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow table.
 */
function splitArrowTableBuffersInternal<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  options: SplitArrowBuffersOptions
): arrow.Table<T> {
  const recordBatches = table.batches.map(recordBatch =>
    splitArrowRecordBatchBuffers(recordBatch, options)
  );
  return new arrow.Table(table.schema, recordBatches);
}

/**
 * Rebuilds an Arrow record batch by rebuilding its data node.
 * @param recordBatch Arrow record batch to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow record batch.
 */
function splitArrowRecordBatchBuffers<T extends arrow.TypeMap>(
  recordBatch: arrow.RecordBatch<T>,
  options: SplitArrowBuffersOptions
): arrow.RecordBatch<T> {
  return new arrow.RecordBatch(
    recordBatch.schema,
    splitArrowDataBuffers(recordBatch.data, options)
  );
}

/**
 * Recursively rebuilds Arrow Data and isolates requested internal typed-array buffers.
 * @param data Arrow data node to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow data node.
 */
function splitArrowDataBuffers<T extends arrow.DataType>(
  data: arrow.Data<T>,
  options: SplitArrowBuffersOptions
): arrow.Data<T> {
  const children = data.children.map(childData => splitArrowDataBuffers(childData, options));
  const dictionary = data.dictionary
    ? splitArrowVectorBuffers(data.dictionary, options)
    : undefined;

  const buffers: Partial<Buffers<T>> = {
    [arrow.BufferType.OFFSET]: splitArrowBuffer(data.buffers[arrow.BufferType.OFFSET], options),
    [arrow.BufferType.DATA]: splitArrowBuffer(data.buffers[arrow.BufferType.DATA], options),
    [arrow.BufferType.VALIDITY]: splitArrowBuffer(data.buffers[arrow.BufferType.VALIDITY], options),
    [arrow.BufferType.TYPE]: splitArrowBuffer(data.buffers[arrow.BufferType.TYPE], options)
  };

  return new arrow.Data(
    data.type,
    data.offset,
    data.length,
    // @ts-expect-error _nullCount is protected. Reuse it to preserve lazy null-count state.
    data._nullCount,
    buffers,
    children,
    dictionary
  );
}

/**
 * Rebuilds an Arrow vector by rebuilding each underlying Data chunk.
 * @param vector Arrow vector to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow vector.
 */
function splitArrowVectorBuffers<T extends arrow.DataType>(
  vector: arrow.Vector<T>,
  options: SplitArrowBuffersOptions
): arrow.Vector<T> {
  return new arrow.Vector(vector.data.map(data => splitArrowDataBuffers(data, options)));
}

/**
 * Copies a typed-array view when requested or when it does not span its full backing buffer.
 * @param array Typed array from an Arrow buffer slot.
 * @param options Buffer splitting options.
 * @returns The original typed array or a copied typed array with a standalone buffer.
 */
function splitArrowBuffer<T>(array: T, options: SplitArrowBuffersOptions): T {
  if (!isArrowTypedArray(array)) {
    return array;
  }

  if (options.copy === 'none') {
    return array;
  }

  if (
    options.copy !== 'all' &&
    array.byteOffset === 0 &&
    array.byteLength === array.buffer.byteLength
  ) {
    return array;
  }

  return array.slice() as T;
}

/**
 * Tests whether a value is an Arrow typed array instead of a DataView.
 * @param value Value to test.
 * @returns True when the value is one of the Arrow internal typed-array buffer types.
 */
function isArrowTypedArray(value: unknown): value is ArrowTypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}
