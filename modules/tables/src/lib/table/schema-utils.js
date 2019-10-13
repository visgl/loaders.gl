// SCHEMA SUPPORT - AUTODEDUCTION

export function deduceTableSchema(table, schema = null) {
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
