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

/** Checks for an Arrow stream and validates its metadata options. */
export function usesNativeArrowBatches(loader: Loader, options: StrictLoaderOptions): boolean {
  const key = getShapeOptionKey(loader);
  const scopedOptions = key && options[key];
  if (
    !scopedOptions ||
    typeof scopedOptions !== 'object' ||
    !('shape' in scopedOptions) ||
    scopedOptions.shape !== 'arrow'
  ) {
    return false;
  }
  if (options.core?.metadata) {
    throw new Error(
      'shape: "arrow" carries metadata in the Arrow schema and does not support core.metadata envelopes'
    );
  }
  return true;
}

/** Yields every record batch, preserving order and iterator cancellation. */
export async function* normalizeNativeArrowBatches(
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
    } else if (isNativeArrowTable(batch)) {
      yield* batch.batches;
    } else {
      throw new Error('shape: "arrow" requires a native Arrow table or record batch');
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
