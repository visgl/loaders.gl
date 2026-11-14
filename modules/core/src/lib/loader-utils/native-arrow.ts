// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {Loader, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';

/** Finds the option namespace used by a loader for shape selection. */
export function getShapeOptionKey(loader: Loader): string | undefined {
  const keys = Object.keys(loader.options || {}).filter(key => {
    const value = loader.options?.[key];
    return key !== 'core' && value && typeof value === 'object' && 'shape' in value;
  });
  return keys.includes(loader.id) ? loader.id : keys.length === 1 ? keys[0] : undefined;
}

/** Resolves native Arrow selection for native parsers and wrapper-based parsers. */
export function getNativeArrowOptions(
  loader: Loader,
  options: StrictLoaderOptions,
  inBatches = false
): StrictLoaderOptions | null {
  const key = getShapeOptionKey(loader);
  const scopedOptions = key && options[key];
  if (
    loader.supportsNativeArrow &&
    scopedOptions &&
    typeof scopedOptions === 'object' &&
    'shape' in scopedOptions &&
    scopedOptions.shape === 'arrow-table'
  ) {
    throw new Error('This loader uses shape: "arrow" for native Arrow output');
  }
  if (
    !scopedOptions ||
    typeof scopedOptions !== 'object' ||
    !('shape' in scopedOptions) ||
    scopedOptions.shape !== 'arrow'
  ) {
    return null;
  }
  if (inBatches && options.core?.metadata) {
    throw new Error(
      'shape: "arrow" carries metadata in the Arrow schema and does not support core.metadata envelopes'
    );
  }
  if (loader.supportsNativeArrow) return options;
  return {
    ...options,
    core: {...options.core, ...(options.core?.shape === 'arrow' ? {shape: 'arrow-table'} : {})},
    [key!]: {...scopedOptions, shape: 'arrow-table'}
  };
}

/** Unwraps legacy tables and passes through results from native parsers. */
export function unwrapArrowTable(result: unknown): arrow.Table;
export function unwrapArrowTable(result: unknown, nativeParser: boolean | undefined): unknown;
export function unwrapArrowTable(result: unknown, nativeParser?: boolean): unknown {
  const table = result as {shape?: string; data?: arrow.Table} | null;
  if (table?.shape === 'arrow-table' && Array.isArray(table.data?.batches)) return table.data;
  if (nativeParser || isNativeArrowTable(result)) return result;
  throw new Error('shape: "arrow" requires a loader that supports "arrow-table" output');
}

/** Yields every record batch, preserving order and iterator cancellation. */
export async function* unwrapArrowBatches(
  batches: AsyncIterable<unknown> | Iterable<unknown>
): AsyncIterable<arrow.RecordBatch> {
  for await (const batch of batches) {
    const batchType = (batch as {batchType?: string} | null)?.batchType;
    // JSON parsers can emit document metadata and partial/final document envelopes.
    if (
      batchType === 'metadata' ||
      batchType === 'partial-result' ||
      batchType === 'final-result'
    ) {
      continue;
    }
    if (isNativeArrowRecordBatch(batch)) {
      yield batch;
    } else {
      yield* unwrapArrowTable(batch).batches;
    }
  }
}

/** Identifies native Arrow tables without loading Arrow in the core entry point. */
export function isNativeArrowTable(value: unknown): value is arrow.Table {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'schema' in value &&
      'batches' in value &&
      Array.isArray(value.batches) &&
      'numRows' in value &&
      typeof value.numRows === 'number' &&
      'getChildAt' in value &&
      typeof value.getChildAt === 'function'
  );
}

/** Identifies native record batches across Arrow package instances. */
export function isNativeArrowRecordBatch(value: unknown): value is arrow.RecordBatch {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as Record<symbol, unknown>)[Symbol.for('apache-arrow/RecordBatch')] === true
  );
}
