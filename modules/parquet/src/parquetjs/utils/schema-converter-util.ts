import type {ParquetSchema} from '../schema/schema';

import {Schema, Field} from '@loaders.gl/schema';
import {PARQUET_TYPE_MAPPING} from '../schema/types';
import {FieldDefinition, ParquetField} from '../schema/declare';
import {Struct} from '@loaders.gl/schema';

export function convertParquetToArrowSchema(parquetSchema: ParquetSchema): Schema {
  const fields = getFields(parquetSchema.schema);

  // TODO add metadata if needed.
  return new Schema(fields);
}

function getFieldMetadata(field: ParquetField): Map<string, string> {
  const metadata = new Map();

  for (const key in field) {
    if (key !== 'name') {
      const value = field[key];
      metadata.set(key, typeof value !== 'string' ? JSON.stringify(field[key]) : value);
    }
  }

  return metadata;
}

function getFields(schema: FieldDefinition): Field[] {
  const fields: Field[] = [];

  for (const name in schema) {
    const field = schema[name];

    if (field.fields) {
      const childField = getFields(field.fields);
      const nestedField = new Field(name, new Struct(childField), field.optional);
      fields.push(nestedField);
    } else {
      const FieldType = PARQUET_TYPE_MAPPING[field.type];
      const metadata = getFieldMetadata(field);
      const arrowField = new Field(name, new FieldType(), field.optional, metadata);
      fields.push(arrowField);
    }
  }

  return fields;
}
