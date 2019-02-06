// https://github.com/apache/arrow/tree/master/js#packaging
import {Table} from '@apache-arrow/es5-cjs';

// Parses arrow to a columnar table
export default function parseArrow(arrayBuffer, options) {
  const arrowTable = Table.from([new Uint8Array(arrayBuffer)]);

  // Extract columns

  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?
  const columnarTable = {};

  arrowTable.schema.fields.forEach(field => {
    columnarTable[field.name] = arrowTable.getColumn(field.name);
  });

  return columnarTable;
}
