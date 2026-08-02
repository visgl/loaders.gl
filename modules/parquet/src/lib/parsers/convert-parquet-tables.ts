// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertArrowToTable} from '@loaders.gl/schema-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';

/**
 * Converts an Arrow-backed table into object rows.
 *
 * @param arrowTable - Arrow table wrapper.
 * @returns Object-row table.
 */
export function convertArrowTableToObjectRows(arrowTable: ArrowTable): ObjectRowTable {
  return convertArrowToTable(arrowTable.data, 'object-row-table') as ObjectRowTable;
}

/**
 * Converts an Arrow batch into object-row output.
 *
 * @param batch - Arrow table batch wrapper.
 * @returns Object-row batch.
 */
export function convertArrowBatchToObjectRows(batch: ArrowTableBatch): ObjectRowTableBatch {
  const objectRowTable = convertArrowToTable(batch.data, 'object-row-table') as ObjectRowTable;

  return {
    batchType: batch.batchType,
    shape: objectRowTable.shape,
    schema: objectRowTable.schema,
    data: objectRowTable.data,
    length: batch.length
  };
}
