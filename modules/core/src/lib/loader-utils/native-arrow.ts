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

/** Keeps native Arrow selection at the API boundary; parsers and workers receive wrappers. */
export function getNativeArrowOptions(
  loader: Loader,
  options: StrictLoaderOptions
): StrictLoaderOptions | null {
  const key = getShapeOptionKey(loader);
  const scopedOptions = key && options[key];
  if (
    !scopedOptions ||
    typeof scopedOptions !== 'object' ||
    !('shape' in scopedOptions) ||
    scopedOptions.shape !== 'arrow'
  ) {
    return null;
  }
  return {
    ...options,
    core: {...options.core, ...(options.core?.shape === 'arrow' ? {shape: 'arrow-table'} : {})},
    [key!]: {...scopedOptions, shape: 'arrow-table'}
  };
}

/** Returns the hydrated native table without copying its columns. */
export function unwrapArrowTable(result: unknown): arrow.Table {
  const table = result as {shape?: string; data?: arrow.Table} | null;
  if (table?.shape !== 'arrow-table' || !table.data || !Array.isArray(table.data.batches)) {
    throw new Error('shape: "arrow" requires a loader that supports "arrow-table" output');
  }
  return table.data;
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
    yield* unwrapArrowTable(batch).batches;
  }
}
