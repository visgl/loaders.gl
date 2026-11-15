// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Updates nullable Arrow table fields to non-nullable when their columns contain no null values. */
export function tightenArrowTableSchemaNullability(table: arrow.Table): arrow.Table {
  const fieldNullability = getTightenedArrowFieldNullability(table);
  if (!doesSchemaHaveTightenedFieldNullability(table.schema, fieldNullability)) {
    return table;
  }
  const schema = tightenApacheArrowSchemaNullability(table.schema, fieldNullability);
  const batches = table.batches.map(
    batch =>
      new arrow.RecordBatch(
        tightenApacheArrowSchemaNullability(batch.schema, fieldNullability),
        batch.data,
        new Map(batch.metadata)
      )
  );
  return new arrow.Table(schema, batches);
}

/** Returns true when a nullable field can be marked as non-nullable. */
function doesSchemaHaveTightenedFieldNullability(
  arrowSchema: arrow.Schema,
  fieldNullability: boolean[]
): boolean {
  return arrowSchema.fields.some(
    (field, fieldIndex) => field.nullable && !fieldNullability[fieldIndex]
  );
}

/** Returns field nullability after checking nullable columns for actual null values. */
function getTightenedArrowFieldNullability(arrowTable: arrow.Table): boolean[] {
  return arrowTable.schema.fields.map((field, fieldIndex) => {
    if (!field.nullable) {
      return false;
    }

    const column = arrowTable.getChildAt(fieldIndex);
    return column ? doesArrowColumnHaveNulls(column) : true;
  });
}

/** Returns true when an Arrow vector contains at least one null value. */
function doesArrowColumnHaveNulls(column: arrow.Vector): boolean {
  if (column.nullCount === 0) {
    return false;
  }

  if (column.nullCount > 0) {
    return true;
  }

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    if (!column.isValid(rowIndex)) {
      return true;
    }
  }

  return false;
}

/** Returns an Apache Arrow schema with matching fields marked non-nullable. */
function tightenApacheArrowSchemaNullability(
  arrowSchema: arrow.Schema,
  fieldNullability: boolean[]
): arrow.Schema {
  const fields = arrowSchema.fields.map((field, fieldIndex) =>
    field.nullable === fieldNullability[fieldIndex]
      ? field
      : field.clone({nullable: fieldNullability[fieldIndex]})
  );

  return new arrow.Schema(
    fields,
    new Map(arrowSchema.metadata),
    new Map(arrowSchema.dictionaries),
    arrowSchema.metadataVersion
  );
}
