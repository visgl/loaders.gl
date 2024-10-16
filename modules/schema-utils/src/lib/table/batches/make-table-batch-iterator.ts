// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableBatch, Table} from '@loaders.gl/schema';
import {getTableLength} from '../tables/table-accessors';

/**
 * Returns an iterator that yields the contents of a table as a sequence of batches.
 * @todo Currently only a single batch is yielded.
 * @note All batches will have the same shape and schema as the original table.
 * @returns
 */
export function* makeTableBatchIterator(table: Table): IterableIterator<TableBatch> {
  yield makeBatchFromTable(table);
}

/**
 * Returns a table packaged as a single table batch
 * @note The batch will have the same shape and schema as the original table.
 * @returns `null` if no batches are yielded by the async iterator
 */
export function makeBatchFromTable(table: Table): TableBatch {
  return {...table, length: getTableLength(table), batchType: 'data'};
}
