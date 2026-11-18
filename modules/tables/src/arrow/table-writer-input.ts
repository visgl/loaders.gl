// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import {isArrowTable} from '@loaders.gl/core/schema-utils';
import type {Table, TableBatch} from '@loaders.gl/core/schema';

/** Input shared by table writers that also accept loaders.gl row or columnar tables. */
export type TableWriterInput = ArrowTable | Table;

/** Batch envelopes supported by table writers alongside native Arrow batches. */
export type TableWriterBatch = TableBatch;

/** Distinguishes native Arrow from the row and column layouts accepted by writers. */
export function isNativeWriterTable(table: TableWriterInput): table is ArrowTable {
  if (isArrowTable(table)) return true;
  if ('data' in table && isArrowTable(table.data)) {
    throw new Error('Pass the Apache Arrow table directly to the writer');
  }
  return false;
}
