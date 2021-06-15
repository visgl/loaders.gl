// SCHEMA SUPPORT - AUTODEDUCTION
import Schema from './classes/schema';
import Field from './classes/field';
import {
  // Int,
  Int8,
  Int16,
  Int32,
  Int64,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  // Float,
  // Float16,
  Float32,
  Float64,
  Bool,
  Utf8,
  TimestampMillisecond,
  Null
} from './classes/type';

const TYPED_ARRAY_TO_TYPE = {
  Int8Array: new Int8(),
  Int16Array: new Int16(),
  Int32Array: new Int32(),
  Uint8Array: new Uint8(),
  Uint8ClampedArray: new Uint8(),
  Uint16Array: new Uint16(),
  Uint32Array: new Uint32(),
  Float32Array: new Float32(),
  Float64Array: new Float64()
};

// if (typeof BigInt64Array !== 'undefined') {
//   TYPED_ARRAY_TO_TYPE.BigInt64Array = new Int64();
//   TYPED_ARRAY_TO_TYPE.BigUint64Array = new Uint64();
// }

// Type deduction

export function deduceTableSchema(table, schema?: Schema) {
  const deducedSchema = Array.isArray(table)
    ? deduceSchemaForRowTable(table)
    : deduceSchemaForColumnarTable(table);
  // Deduced schema will fill in missing info from partial options.schema, if provided
  return Object.assign(deducedSchema, schema);
}

/**
 * Type deduction from columnar array
 *
 * Notes:
 * - If the column is a typed array we are able to make a fairly precise type deduction
 * - However we can't tell if it is intervals, dates, fixed size lists etc.
 * - Nullable typed arrays are only supported if backing table is Arrow
 *
 * @param {*} columnArray
 * @returns type, nullable, metadata - (Arrow-like) type information
 */
function getTypeFromColumnArray(columnArray) {
  const ArrayType = columnArray.constructor && columnArray.constructor.name;
  let type = TYPED_ARRAY_TO_TYPE[ArrayType];
  if (type) {
    return {type, nullable: false, metadata: null};
  }

  let metadata: Map<string, any> | null = null;
  if (columnArray.length > 0) {
    const value = columnArray[0];
    type = deduceTypeFromValue(value);
    if (type) {
      metadata = new Map([['type', type.toString()]]);
    }
  }

  // We use fields of Arrow-Type Null to indicate that we represent additional, non binary columns
  return {type: new Null(), nullable: true, metadata};
}

function deduceSchemaForColumnarTable(columnarTable) {
  const fields: Field[] = [];
  for (const columnName in columnarTable) {
    const columnArray = columnarTable[columnName];
    const {type, nullable, metadata} = getTypeFromColumnArray(columnArray);
    fields.push(new Field(columnName, type, nullable, metadata || new Map()));
  }
  return new Schema(fields);
}

function deduceSchemaForRowTable(rowTable) {
  const fields: Field[] = [];
  if (rowTable.length) {
    const row = rowTable[0];
    // Note - handle rows in both array and object format
    if (Array.isArray(row)) {
      // row: [value1, value2, ...]
      for (let columnIndex = 0; columnIndex < row.length; ++columnIndex) {
        const value = row[columnIndex];
        const name = String(columnIndex);
        const type = deduceTypeFromValue(value);
        const nullable = true;
        const metadata = new Map([['type', type.toString()]]);
        fields.push(new Field(name, new Null(), nullable, metadata));
      }
    } else {
      for (const columnName in row) {
        // row: {columnName1: value1, columnName2: value2, ...}
        // TODO - Could look at additional rows if nulls in first row
        const value = row[columnName];
        const type = deduceTypeFromValue(value);
        const nullable = true;
        const metadata = new Map([['type', type.toString()]]);
        fields.push(new Field(columnName, new Null(), nullable, metadata));
      }
    }
  }
  return new Schema(fields);
}

function deduceTypeFromValue(value) {
  if (value === true || value === false) {
    return new Bool();
  }
  if (value instanceof Date) {
    return new TimestampMillisecond();
  }
  if (value instanceof Number) {
    return new Float32();
  }
  if (typeof value === 'string') {
    return new Utf8();
  }
  // TODO JS columns (arrays and object valued) are currently null
  return new Null();
}
