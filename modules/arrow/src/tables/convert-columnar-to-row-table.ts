// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';

/**
 *
 * @note - should be part of schema module
 */
export function convertColumnarToRowFormatTable(columnarTable: ColumnarTable): ObjectRowTable {
  const tableKeys = Object.keys(columnarTable);
  const tableRowsCount = columnarTable[tableKeys[0]].length;

  const rowFormatTable: {}[] = [];

  for (let index = 0; index < tableRowsCount; index++) {
    const tableItem = {};
    for (let keyIndex = 0; keyIndex < tableKeys.length; keyIndex++) {
      const fieldName = tableKeys[keyIndex];
      tableItem[fieldName] = columnarTable[fieldName][index];
    }
    rowFormatTable.push(tableItem);
  }

  return {
    shape: 'object-row-table',
    schema: columnarTable.schema,
    data: rowFormatTable
  };
}
