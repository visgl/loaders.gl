// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTableBatch, TableBatch} from '@loaders.gl/core/schema';
import {executeTableScanBatches} from '@loaders.gl/core/loader-utils';
import {queryArrowTable, type ArrowQueryOptions} from './query-arrow-table';

/**
 * Runs linear Arrow queries over a demand-driven stream with one global row limit.
 * Returning from the consumer closes the input iterator; no output batches are collected here.
 */
export async function* queryArrowTableInBatches(
  batches: AsyncIterable<ArrowTableBatch>,
  options: ArrowQueryOptions = {}
): AsyncIterable<ArrowTableBatch> {
  if (
    options.expressions?.length ||
    options.orderBy?.length ||
    options.groupBy?.length ||
    options.aggregates?.length ||
    options.union?.length ||
    options.join
  ) {
    throw new Error(
      'Streaming Arrow queries support only predicates, projection, aliases, and limits.'
    );
  }
  if (options.select !== undefined && options.columns !== undefined) {
    throw new Error('Arrow select cannot be combined with columns.');
  }
  const outputs = executeTableScanBatches(
    () => batches,
    {
      predicate: options.predicate,
      limit: options.limit,
      signal: options.signal
    },
    {
      filter: batch => applyQuery(batch, {predicate: options.predicate, signal: options.signal}),
      project: batch =>
        applyQuery(batch, {
          select: options.select,
          columns: options.columns,
          signal: options.signal
        })
    }
  );
  for await (const batch of outputs) yield batch as ArrowTableBatch;
}

/** Applies a shared in-memory kernel while retaining the streaming batch envelope. */
function applyQuery(batch: TableBatch, options: ArrowQueryOptions): ArrowTableBatch {
  if (batch.shape !== 'arrow-table')
    throw new Error('Streaming Arrow query requires Arrow batches.');
  const result = queryArrowTable(batch, options);
  return {...batch, ...result, length: result.data.numRows} as ArrowTableBatch;
}
