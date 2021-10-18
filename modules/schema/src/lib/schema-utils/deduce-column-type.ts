// Type deduction
// import {
//   Schema
//   Int,
//   Int8,
//   Int16,
//   Int32,
//   Uint8,
//   Uint16,
//   Uint32,
//   Float32,
//   Float64
//   Bool,
//   Utf8,
//   TimestampMillisecond,
//   Null
// } from '../schema';

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

export function deduceTypeFromColumn(
  value: unknown
): StringConstructor | DateConstructor | Float32ArrayConstructor | null {
  if (value instanceof Date) {
    return Date;
  } else if (value instanceof Number) {
    return Float32Array;
  } else if (typeof value === 'string') {
    return String;
  }
  return null;
}

export function deduceTypeFromValue(
  value: unknown
): StringConstructor | DateConstructor | Float32ArrayConstructor | null {
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
