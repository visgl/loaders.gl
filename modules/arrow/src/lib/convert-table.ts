// loaders.gl, MIT license
import type {ColumnarTable, ArrowTable} from '@loaders.gl/schema';
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
