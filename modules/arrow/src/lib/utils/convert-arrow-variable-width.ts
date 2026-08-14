// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  deserializeArrowType,
  serializeArrowType,
  type ArrowSchemaConversionOptions
} from '@loaders.gl/schema-utils';

/** Options controlling conversion between standard and view-based Arrow variable-width types. */
export type ConvertArrowVariableWidthOptions = ArrowSchemaConversionOptions;

type ArrowVariableWidthTypeName = 'binary' | 'binary-view' | 'utf8' | 'utf8-view';

/**
 * Converts an Arrow Utf8, Utf8View, Binary, or BinaryView vector to the requested storage layout.
 *
 * `viewTypes: 'never'` produces Utf8 or Binary. `viewTypes: 'prefer'` produces the corresponding
 * view type when the installed Arrow runtime supports it and otherwise produces the standard
 * type. `viewTypes: 'require'` produces a view type or throws when the runtime lacks support.
 * Existing vectors already using the selected type are returned without copying.
 *
 * @param vector - Arrow variable-width vector to convert.
 * @param options - Target variable-width storage layout.
 * @returns The original vector or a converted vector with the same values and chunk boundaries.
 */
export function convertArrowVariableWidthVector(
  vector: arrow.Vector,
  options: ConvertArrowVariableWidthOptions = {}
): arrow.Vector {
  const sourceTypeName = getArrowVariableWidthTypeName(vector.type);
  const targetTypeName = getTargetArrowVariableWidthTypeName(sourceTypeName);
  const targetType = deserializeArrowType(targetTypeName, options);

  if (vector.type.typeId === targetType.typeId) {
    return vector;
  }

  const convertedData = vector.data.flatMap(data => {
    const chunk = new arrow.Vector([data]);
    return arrow.vectorFromArray(Array.from(chunk), targetType as never).data;
  });

  return new arrow.Vector(convertedData);
}

/**
 * Converts every top-level Utf8, Utf8View, Binary, and BinaryView column in an Arrow table.
 *
 * Non-variable-width columns are preserved without copying. Table schema metadata, field metadata,
 * nullability, row values, and source chunk boundaries are retained.
 *
 * @param table - Arrow table whose top-level variable-width columns should be converted.
 * @param options - Target variable-width storage layout.
 * @returns The original table when no column changes, otherwise a table with converted columns.
 */
export function convertArrowTableVariableWidthTypes(
  table: arrow.Table,
  options: ConvertArrowVariableWidthOptions = {}
): arrow.Table {
  const columns: Record<string, arrow.Vector> = {};
  const fields: arrow.Field[] = [];
  let changed = false;

  for (const field of table.schema.fields) {
    const column = table.getChild(field.name);
    if (!column) {
      throw new Error(`Missing Arrow column for ${field.name}`);
    }

    const convertedColumn = isArrowVariableWidthType(field.type)
      ? convertArrowVariableWidthVector(column, options)
      : column;
    changed ||= convertedColumn !== column;
    columns[field.name] = convertedColumn;
    fields.push(
      convertedColumn === column
        ? field
        : new arrow.Field(field.name, convertedColumn.type, field.nullable, field.metadata)
    );
  }

  if (!changed) {
    return table;
  }

  const schema = new arrow.Schema(fields as never, table.schema.metadata);
  return new (arrow.Table as any)(schema, columns) as arrow.Table;
}

function isArrowVariableWidthType(type: arrow.DataType): boolean {
  try {
    getArrowVariableWidthTypeName(type);
    return true;
  } catch {
    return false;
  }
}

function getArrowVariableWidthTypeName(type: arrow.DataType): ArrowVariableWidthTypeName {
  const typeName = serializeArrowType(type);
  switch (typeName) {
    case 'binary':
    case 'binary-view':
    case 'utf8':
    case 'utf8-view':
      return typeName;
    default:
      throw new Error(
        `Expected an Arrow Utf8, Utf8View, Binary, or BinaryView vector, received ${type}`
      );
  }
}

function getTargetArrowVariableWidthTypeName(
  sourceTypeName: ArrowVariableWidthTypeName
): 'binary' | 'utf8' {
  return sourceTypeName === 'binary' || sourceTypeName === 'binary-view' ? 'binary' : 'utf8';
}
