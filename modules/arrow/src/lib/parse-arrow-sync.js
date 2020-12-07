/* global BigInt64Array, BigUint64Array */
import {Table, Type} from 'apache-arrow/Arrow.es5.min';

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
    const values = transformValues(arrowColumn);
    columnarTable[field.name] = values;
  });

  return columnarTable;
}

function transformValues(arrowColumn) {
  // 64-bit number convert to string to be compatible with IE11
  if (arrowColumn.type.bitWidth === 64) {
    const ArrayCtor = getBigArrayConstructor(arrowColumn.type);
    const result = new ArrayCtor(arrowColumn.length);
    for (let index = 0; index < arrowColumn.length; index++) {
      result[index] = arrowColumn.get(index).toString();
    }
    return result;
  }
  return arrowColumn.toArray();
}

function getBigArrayConstructor(type) {
  switch (type.typeId) {
    case Type.Int:
      if (type.isSigned) {
        return BigInt64Array ? BigInt64Array : Array;
      }
      return BigUint64Array ? BigUint64Array : Array;
    case Type.Float:
      return Float64Array ? Float64Array : Array;
    default:
      return Array;
  }
}
