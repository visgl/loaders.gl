// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';

import type {OtlpTrace, OtlpTraceBatch, OtlpTraceTableName} from './otlp-trace-arrow-schema';

/** Emits all non-empty logical tables from one OTLP trace. */
export function* emitOtlpTraceBatches(
  trace: OtlpTrace,
  batchSize: number
): Iterable<OtlpTraceBatch> {
  yield* emitTableBatches('resources', trace.resources, batchSize);
  yield* emitTableBatches('scopes', trace.scopes, batchSize);
  yield* emitTableBatches('spans', trace.spans, batchSize);
  yield* emitTableBatches('events', trace.events, batchSize);
  yield* emitTableBatches('links', trace.links, batchSize);
}

/** Normalizes one OTLP Arrow batch size. */
export function normalizeOtlpBatchSize(batchSize: number | undefined): number {
  return batchSize && Number.isFinite(batchSize) && batchSize > 0
    ? Math.max(1, Math.floor(batchSize))
    : 4096;
}

/** Emits bounded record batches from one logical OTLP table. */
function* emitTableBatches(
  tableName: OtlpTraceTableName,
  table: arrow.Table,
  batchSize: number
): Iterable<OtlpTraceBatch> {
  for (let rowOffset = 0; rowOffset < table.numRows; rowOffset += batchSize) {
    for (const data of table.slice(rowOffset, rowOffset + batchSize).batches) {
      yield {table: tableName, data};
    }
  }
}
