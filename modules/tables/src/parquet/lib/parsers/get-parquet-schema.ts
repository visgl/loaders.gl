// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
import * as arrow from 'apache-arrow';
import {Schema, type Field} from '@loaders.gl/core/schema';
import {unpackGeoMetadata, unpackJSONStringMetadata} from '@loaders.gl/core/schema';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {convertParquetSchema} from '../arrow/convert-schema-from-parquet';
import {applyGeoParquetToFieldMetadata} from '../geo/geospatial-metadata';

export async function getSchemaFromParquetReader(reader: ParquetReader): Promise<Schema> {
  const parquetSchema = await reader.getSchema();
  const parquetMetadata = await reader.getFileMetadata();
  const schema = convertParquetSchema(parquetSchema, parquetMetadata, {
    int96AsTimestamp: reader.int96AsTimestamp
  });
  restoreEmbeddedArrowMetadata(schema);
  applyGeoParquetToFieldMetadata(schema);
  unpackGeoMetadata(schema.metadata);
  unpackJSONStringMetadata(schema.metadata, 'pandas');
  return schema;
}

/** Restores metadata stored only in the standard base64 Arrow schema footer entry. */
function restoreEmbeddedArrowMetadata(schema: Schema): void {
  const encodedSchema = schema.metadata?.['ARROW:schema'];
  if (typeof encodedSchema !== 'string') {
    return;
  }
  try {
    const bytes = Uint8Array.from(atob(encodedSchema), character => character.charCodeAt(0));
    const embeddedSchema = arrow.RecordBatchReader.from(bytes).open().schema;
    if (embeddedSchema) {
      schema.metadata = {...Object.fromEntries(embeddedSchema.metadata), ...schema.metadata};
      restoreArrowFieldMetadata(schema.fields, embeddedSchema.fields);
    }
  } catch {
    // Optional Arrow metadata must not prevent decoding an otherwise valid Parquet schema.
  }
}

/** Merges embedded field metadata without replacing the physical Parquet data types. */
function restoreArrowFieldMetadata(fields: Field[], arrowFields: arrow.Field[]): void {
  for (const field of fields) {
    const arrowField = arrowFields.find(candidate => candidate.name === field.name);
    if (!arrowField) {
      continue;
    }
    field.metadata = {...Object.fromEntries(arrowField.metadata), ...field.metadata};
    if (typeof field.type === 'object' && 'children' in field.type && arrowField.type.children) {
      restoreArrowFieldMetadata(field.type.children, arrowField.type.children);
    }
  }
}
