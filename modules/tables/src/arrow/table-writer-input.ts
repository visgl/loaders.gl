// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {ArrowTable as WrappedArrowTable, Table, TableBatch} from '@loaders.gl/core/schema';

/** Input shared by table writers that also accept loaders.gl row or columnar tables. */
export type TableWriterInput = ArrowTable | Exclude<Table, WrappedArrowTable>;

/** Batch envelopes supported by table writers alongside native Arrow batches. */
export type TableWriterBatch = Exclude<TableBatch, {shape: 'arrow-table'}>;

/** Checks the native Arrow branch and reports obsolete wrapper input from JavaScript. */
export function isNativeWriterTable(table: TableWriterInput): table is ArrowTable {
  if ('shape' in table) {
    if ((table as Table).shape === 'arrow-table') {
      throw new Error('Pass the Apache Arrow table in data directly to the writer');
    }
    return false;
  }
  return true;
}
