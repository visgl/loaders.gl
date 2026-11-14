// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {validateTableQueryLimit} from '@loaders.gl/core/loader-utils';
import {filterArrowTable, projectArrowTable} from './arrow-execution';
import type {ArrowQueryOptions} from './query-arrow-table';

/**
 * Runs linear Arrow queries over a demand-driven stream with one global row limit.
 * Returning from the consumer closes the input iterator; no output batches are collected here.
 */
export async function* queryArrowTableInBatches(
  batches: AsyncIterable<arrow.RecordBatch>,
  options: ArrowQueryOptions = {}
): AsyncIterable<arrow.RecordBatch> {
  if (
    options.expressions?.length ||
    options.orderBy?.length ||
    options.groupBy?.length ||
    options.aggregates?.length ||
    options.union?.length ||
    options.join
  ) {
    throw new Error('Streaming Arrow queries support only filter, projection, and limit.');
  }
  if (options.select !== undefined && options.columns !== undefined) {
    throw new Error('Arrow select cannot be combined with columns.');
  }
  validateTableQueryLimit(options.limit);
  let remaining = options.limit;
  options.signal?.throwIfAborted();
  if (remaining === 0) return;
  for await (const batch of batches) {
    options.signal?.throwIfAborted();
    let table = new arrow.Table(batch.schema, [batch]);
    if (options.predicate) {
      table = filterArrowTable(table, options.predicate, {
        limit: remaining,
        signal: options.signal
      });
    } else if (remaining !== undefined && remaining < table.numRows) {
      table = new arrow.Table(batch.schema, [batch.slice(0, remaining)]);
    }
    const selections = options.select ?? options.columns;
    if (selections) table = projectArrowTable(table, selections);
    if (table.batches.length) yield* table.batches;
    else yield new arrow.RecordBatch(table.schema, undefined, new Map(batch.metadata));
    if (remaining !== undefined) {
      remaining -= table.numRows;
      if (remaining === 0) return;
    }
  }
}
