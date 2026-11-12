// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowJSTable} from 'apache-arrow';
import type {ArrowTable, Table} from '@loaders.gl/core/schema';
import {convertArrowToTable} from '@loaders.gl/core/schema-utils';

/** Adapts native Arrow input to the table encoder without copying column buffers. */
export function wrapWriterTable<TableT extends Table>(
  table: TableT | ArrowJSTable
): TableT | ArrowTable {
  return 'shape' in table ? table : convertArrowToTable(table, 'arrow-table');
}
