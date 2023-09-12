// loaders.gl, MIT license
import type {ColumnarTable, ObjectRowTable, ArrowTable} from '@loaders.gl/schema';
import type {Table as ApacheArrowTable} from 'apache-arrow';

/**
 * Wrap an apache arrow table in a loaders.gl table wrapper.
 * From this additional conversions are available.
 * @param arrowTable
 * @returns
 */
export function convertApacheArrowToArrowTable(arrowTable: ApacheArrowTable): ArrowTable {
  return {
    shape: 'arrow-table',
    data: arrowTable
  };
}

/**
 * Convert an Apache Arrow table to a ColumnarTable
 * @note Currently does not convert schema
 */
export function convertArrowToColumnarTable(table: ArrowTable): ColumnarTable {
  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?

  const arrowTable = table.data;
  const columnarTable = {};

  for (const field of arrowTable.schema.fields) {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getChild(field.name);
    const values = arrowColumn?.toArray();
    columnarTable[field.name] = values;
  }

  return {
    shape: 'columnar-table',
    data: columnarTable
  };
}

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
    data: rowFormatTable
  };
}
