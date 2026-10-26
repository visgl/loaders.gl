// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
} from '@loaders.gl/core/schema-utils/arrow-transport';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/core/schema';
import type {CSVLoaderOptions} from '../csv-loader-options';

/** Transfers owned CSV column buffers without detaching parser-retained storage. */
export function serializeCSVWorkerResult(result: unknown, _options?: CSVLoaderOptions): unknown {
  return serializeArrowWorkerTable(result);
}

/** Hydrates CSV columns on the caller. */
export function deserializeCSVWorkerResult(result: unknown): ArrowTable {
  return deserializeArrowWorkerTable(result);
}

/** Applies the shared column transport to each CSV batch. */
export const serializeCSVWorkerBatch = serializeCSVWorkerResult;

/** Hydrates one CSV batch while retaining its metadata. */
export function deserializeCSVWorkerBatch(batch: unknown): ArrowTableBatch {
  return deserializeArrowWorkerTable(batch) as ArrowTableBatch;
}
