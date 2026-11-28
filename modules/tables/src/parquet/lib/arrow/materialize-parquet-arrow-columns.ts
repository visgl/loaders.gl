// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayType, Schema} from '@loaders.gl/core/schema';
import {deserializeArrowField} from '@loaders.gl/core/schema-utils';
import type {ParquetRowGroup} from '../../parquetjs/schema/declare';
import type {ParquetSchema} from '../../parquetjs/schema/schema';
import {
  hasStandardNestedCollection,
  normalizeLegacyArrowValue,
  normalizeNestedParquetValue
} from './normalize-parquet-collections';

/** Materializes source columns, unwrapping standard collections before Arrow conversion. */
export function materializeParquetArrowColumns(
  parquetSchema: ParquetSchema,
  rowGroup: ParquetRowGroup,
  schema: Schema
): Record<string, ArrayType> {
  const collectionFields = schema.fields
    .filter(field => typeof field.type === 'object' && parquetSchema.fields[field.name]?.fields)
    .map(field => deserializeArrowField(field))
    .filter(field => hasStandardNestedCollection(parquetSchema.fields[field.name], field.type));
  if (!collectionFields.length) {
    return parquetSchema.materializeColumns(rowGroup);
  }

  const collectionNames = new Set(collectionFields.map(field => field.name));
  const collectionColumns: ParquetRowGroup['columnData'] = {};
  const otherColumns: ParquetRowGroup['columnData'] = {};
  for (const [key, column] of Object.entries(rowGroup.columnData)) {
    const columns = collectionNames.has(parquetSchema.findFieldBranch(key)[0].name)
      ? collectionColumns
      : otherColumns;
    columns[key] = column;
  }
  const columns = parquetSchema.materializeColumns({...rowGroup, columnData: otherColumns});
  const rows = parquetSchema.materializeRows({...rowGroup, columnData: collectionColumns});
  for (const field of collectionFields) {
    const parquetField = parquetSchema.findField(field.name);
    columns[field.name] = rows.map(row =>
      normalizeLegacyArrowValue(
        normalizeNestedParquetValue(row[field.name], parquetField, field.type),
        field
      )
    );
  }
  return columns;
}

/** Checks whether a projection includes a native GeoArrow list geometry. */
export function hasNativeGeoArrowList(schema: Schema): boolean {
  return schema.fields.some(
    field =>
      typeof field.type === 'object' &&
      field.type.type === 'list' &&
      field.metadata?.['ARROW:extension:name']?.startsWith('geoarrow.')
  );
}
