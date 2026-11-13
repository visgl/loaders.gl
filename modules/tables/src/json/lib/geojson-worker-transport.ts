// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table as ArrowTable, RecordBatch} from 'apache-arrow';
import {
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';

/** Transfers native Arrow columns and preserves structured-clone geometry output. */
export function serializeGeoJSONWorkerResult(result: unknown): unknown {
  return result instanceof ArrowTable || result instanceof RecordBatch
    ? serializeNativeArrowWorkerResult(result)
    : result;
}

/** Hydrates native Arrow payloads while retaining binary geometry typed arrays. */
export function deserializeGeoJSONWorkerResult(result: unknown): any {
  const transport = (result as {transport?: string})?.transport;
  return transport === 'arrow-table-columns' || transport === 'arrow-record-batch'
    ? deserializeNativeArrowWorkerResult(result)
    : result;
}
