// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {
  ArrowTable as WrappedArrowTable,
  ArrowTableBatch,
  Table,
  TableBatch
} from '@loaders.gl/core/schema';

/** Input shared by table writers that also accept loaders.gl row or columnar tables. */
export type TableWriterInput = ArrowTable | Exclude<Table, WrappedArrowTable>;

/** Batch envelopes supported by table writers alongside native Arrow batches. */
export type TableWriterBatch = Exclude<TableBatch, ArrowTableBatch>;

/** Distinguishes native Arrow from the row and column layouts accepted by writers. */
export function isNativeWriterTable(table: TableWriterInput): table is ArrowTable {
  if (!('shape' in table)) return true;
  switch (table.shape) {
    case 'object-row-table':
    case 'array-row-table':
    case 'columnar-table':
    case 'geojson-table':
      return false;
    default:
      throw new Error('Pass the Apache Arrow table directly to the writer');
  }
}
