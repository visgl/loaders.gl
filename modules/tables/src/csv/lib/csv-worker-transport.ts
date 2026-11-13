// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {Table as ArrowTable, RecordBatch as ArrowTableBatch} from 'apache-arrow';
import type {CSVLoaderOptions} from '../csv-loader-options';

/** Transfers owned CSV column buffers without detaching parser-retained storage. */
export function serializeCSVWorkerResult(result: unknown, _options?: CSVLoaderOptions): unknown {
  return serializeNativeArrowWorkerResult(result as ArrowTable | ArrowTableBatch);
}

/** Hydrates CSV columns on the caller. */
export function deserializeCSVWorkerResult(result: unknown): ArrowTable {
  return deserializeNativeArrowWorkerResult(result as ArrowTable | ArrowTableBatch);
}

/** Applies the shared column transport to each CSV batch. */
export const serializeCSVWorkerBatch = serializeCSVWorkerResult;

/** Hydrates one CSV batch while retaining its metadata. */
export function deserializeCSVWorkerBatch(batch: unknown): ArrowTableBatch {
  return deserializeNativeArrowWorkerResult(batch) as ArrowTableBatch;
}
