// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {createRecordBatchWithMetadata, getRecordBatchMetadata} from '@math.gl/core/arrow';
import {queryArrowTableInBatches as executeArrowQueryInBatches} from '@math.gl/sql/query';
import {validateTableQueryLimit} from '@loaders.gl/core/loader-utils';
import {filterArrowTable} from './arrow-execution/filter-arrow-table';
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
  options.signal?.throwIfAborted();
  if (options.limit === 0) return;
  const iterator = batches[Symbol.asyncIterator]();
  try {
    const first = await iterator.next();
    if (first.done) return;
    /** Applies portable filtering within the remaining limit, before math.gl projects rows. */
    async function* readBatches(): AsyncIterable<arrow.RecordBatch> {
      let remaining = options.limit;
      for (
        let next: IteratorResult<arrow.RecordBatch> = first;
        !next.done;
        next = await iterator.next()
      ) {
        const batch = next.value;
        if (!options.predicate) {
          yield batch;
          continue;
        }
        const filtered = filterArrowTable(
          new arrow.Table(batch.schema, [batch]),
          options.predicate,
          {limit: remaining, signal: options.signal}
        );
        if (filtered.numRows) yield* filtered.batches;
        else
          yield createRecordBatchWithMetadata(
            batch.schema,
            new arrow.RecordBatch(batch.schema, undefined).data,
            getRecordBatchMetadata(batch)
          );
        if (remaining !== undefined) {
          remaining -= filtered.numRows;
          if (remaining === 0) return;
        }
      }
    }
    yield* executeArrowQueryInBatches(readBatches(), first.value.schema, {
      select: options.select ?? options.columns,
      limit: options.limit,
      signal: options.signal,
      emitEmptyBatches: true
    });
  } finally {
    await iterator.return?.();
  }
}
