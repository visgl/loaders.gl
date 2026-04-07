// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, Field, Schema} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

/** Updates nullable Arrow table fields to non-nullable when their columns contain no null values. */
export function tightenArrowTableSchemaNullability(table: ArrowTable): ArrowTable {
  const arrowTable = table.data;
  const fieldNullability = getTightenedArrowFieldNullability(arrowTable);

  if (!doesSchemaHaveTightenedFieldNullability(arrowTable.schema, fieldNullability)) {
    return table;
  }

  const arrowSchema = tightenApacheArrowSchemaNullability(arrowTable.schema, fieldNullability);
  const schema = tightenLoadersSchemaNullability(
    table.schema || convertArrowToSchema(arrowTable.schema),
    fieldNullability
  );

  return {
    ...table,
    schema,
    data: makeArrowTableWithSchema(arrowTable, arrowSchema)
  };
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

/** Returns a loaders.gl schema with matching fields marked non-nullable. */
function tightenLoadersSchemaNullability(schema: Schema, fieldNullability: boolean[]): Schema {
  return {
    ...schema,
    fields: schema.fields.map((field, fieldIndex) =>
      field.nullable && !fieldNullability[fieldIndex]
        ? tightenLoadersSchemaFieldNullability(field, false)
        : field
    )
  };
}

/** Returns a loaders.gl schema field with updated nullability. */
function tightenLoadersSchemaFieldNullability(field: Field, nullable: boolean): Field {
  return {
    ...field,
    nullable
  };
}

/** Returns a new Arrow table with the supplied schema while reusing existing column buffers. */
function makeArrowTableWithSchema(arrowTable: arrow.Table, arrowSchema: arrow.Schema): arrow.Table {
  const recordBatches = arrowTable.batches.map(
    (recordBatch) => new arrow.RecordBatch(arrowSchema, recordBatch.data)
  );
  return new arrow.Table(arrowSchema, recordBatches);
}
