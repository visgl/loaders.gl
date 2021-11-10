// Type deduction
import {
  Schema
  // Int,
  // Int8,
  // Int16,
  // Int32,
  // Uint8,
  // Uint16,
  // Uint32,
  // Float32,
  // Float64
  // Bool,
  // Utf8,
  // TimestampMillisecond,
  // Null
} from '../../lib/schema/schema';

// const TYPED_ARRAY_TO_TYPE = {
//   Int8Array: new Int8(),
//   Int16Array: new Int16(),
//   Int32Array: new Int32(),
//   Uint8Array: new Uint8(),
//   Uint8ClampedArray: new Uint8(),
//   Uint16Array: new Uint16(),
//   Uint32Array: new Uint32(),
//   Float32Array: new Float32(),
//   Float64Array: new Float64()
// };

// if (typeof BigInt64Array !== 'undefined') {
//   TYPED_ARRAY_TO_TYPE.BigInt64Array = new Int64();
//   TYPED_ARRAY_TO_TYPE.BigUint64Array = new Uint64();
// }

/**
 * SCHEMA SUPPORT - AUTODEDUCTION
 * @param {*} table
 * @param {*} schema
 * @returns
 */
export function deduceTableSchema(table, schema?: Schema) {
  const deducedSchema = Array.isArray(table)
    ? deduceSchemaForRowTable(table)
    : deduceSchemaForColumnarTable(table);
  // Deduced schema will fill in missing info from partial options.schema, if provided
  return Object.assign(deducedSchema, schema);
}

function deduceSchemaForColumnarTable(columnarTable) {
  const schema = {};
  for (const field in columnarTable) {
    const column = columnarTable[field];
    // Check if column is typed, if so we are done
    if (ArrayBuffer.isView(column)) {
      schema[field] = column.constructor;
      // else we need data
    } else if (column.length) {
      const value = column[0];
      schema[field] = deduceTypeFromValue(value);
      // TODO - support nested schemas?
    }
    // else we mark as present but unknow
    schema[field] = schema[field] || null;
  }
  return schema;
}

function deduceSchemaForRowTable(rowTable) {
  const schema = {};
  if (rowTable.length) {
    const row = rowTable[0];
    // TODO - Could look at additional rows if nulls in first row
    for (const field in row) {
      const value = row[field];
      schema[field] = deduceTypeFromValue(value);
    }
  }
  return schema;
}

function deduceTypeFromValue(value) {
  if (value instanceof Date) {
    return Date;
  } else if (value instanceof Number) {
    return Float32Array;
  } else if (typeof value === 'string') {
    return String;
  }
  return null;
}

/*
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deduceSchema(rows) {
  const row = rows[0];

  const schema = {};
  let i = 0;
  for (const columnName in row) {
    const value = row[columnName];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: String(columnName), index: i, type: Float32Array};
        break;

      case 'object':
        schema[columnName] = {name: String(columnName), index: i, type: Array};
        break;

      case 'string':
      default:
        schema[columnName] = {name: String(columnName), index: i, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
    i++;
  }
  return schema;
}
*/
