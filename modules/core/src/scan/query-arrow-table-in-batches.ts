// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {queryArrowTableInBatches as executeArrowQueryInBatches} from '@math.gl/sql/query';
import {validateTableQueryLimit} from '@loaders.gl/core/loader-utils';
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
  yield* executeArrowQueryInBatches(batches, {
    select: options.select ?? options.columns,
    where: options.predicate,
    limit: options.limit,
    signal: options.signal,
    emitEmptyBatches: true
  });
}
