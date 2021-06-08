import {Table} from 'apache-arrow';

// Parses arrow to a columnar table
export default function parseArrowSync(arrayBuffer, options) {
  const arrowTable = Table.from([new Uint8Array(arrayBuffer)]);

  // Extract columns

  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?
  const columnarTable = {};

  arrowTable.schema.fields.forEach((field) => {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getColumn(field.name);
    const values = arrowColumn.toArray();
    columnarTable[field.name] = values;
  });

  switch (options.arrow.rowFormat) {
    case 'auto':
      return columnarTable;
    case 'object':
      return convertColumnarToRowFormatTable(columnarTable);
    default:
      return columnarTable;
  }
}

function convertColumnarToRowFormatTable(columnarTable) {
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
  return rowFormatTable;
}
