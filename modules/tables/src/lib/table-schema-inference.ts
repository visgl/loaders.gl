// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Selects which records contribute to an inferred table schema. */
export type TableSchemaInference = 'full' | 'first-batch';

/** Caps the number of records required to infer a streaming schema. */
const MAX_INFERENCE_ROWS = 1024;

/** Returns the number of logical records needed to infer a table schema. */
export function getTableSchemaInferenceRows(
  inference: TableSchemaInference,
  batchSize?: number | 'auto'
): number {
  if (inference === 'full') return Infinity;
  return typeof batchSize === 'number' && batchSize > 0
    ? Math.max(1, Math.min(Math.floor(batchSize), MAX_INFERENCE_ROWS))
    : MAX_INFERENCE_ROWS;
}
