import {Table} from 'apache-arrow/Arrow.es5.min';

// Parses arrow to a columnar table
export default function parseArrowSync(arrayBuffer, options) {
  const arrowTable = Table.from([new Uint8Array(arrayBuffer)]);

  // Extract columns

  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?
  const columnarTable = {};

  arrowTable.schema.fields.forEach(field => {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getColumn(field.name);
    const values = arrowColumn.toArray();
    columnarTable[field.name] = values;
  });

  return options.rowBased ? convertColumnarToRowBasedTable(columnarTable) : columnarTable;
}

function convertColumnarToRowBasedTable(columnarTable) {
  const tableKeys = Object.keys(columnarTable);
  const tableRowsCount = columnarTable[tableKeys[0]].length;
  const rowBasedTable = [];

  for (let index = 0; index < tableRowsCount; index++) {
    const tableItem = {};
    for (let keyIndex = 0; keyIndex < tableKeys.length; keyIndex++) {
      const fieldName = tableKeys[keyIndex];
      tableItem[fieldName] = columnarTable[fieldName][index];
    }
    rowBasedTable.push(tableItem);
  }
  return rowBasedTable;
}
