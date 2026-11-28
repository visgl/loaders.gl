// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ParquetField} from '../../parquetjs/schema/declare';

/** Converts absent legacy repeated values to empty lists before invoking Arrow builders. */
export function normalizeLegacyArrowValue(value: unknown, field: arrow.Field): unknown {
  if (value === undefined || value === null) {
    return field.type instanceof arrow.List && !field.nullable ? [] : null;
  }
  if (field.type instanceof arrow.List && Array.isArray(value)) {
    return value.map(element => normalizeLegacyArrowValue(element, field.type.children[0]));
  }
  if (field.type instanceof arrow.Struct && typeof value === 'object') {
    return Object.fromEntries(
      field.type.children.map(child => [
        child.name,
        normalizeLegacyArrowValue(Reflect.get(value, child.name), child)
      ])
    );
  }
  return value;
}

/** Detects standard collection wrappers that need normalization before Arrow conversion. */
export function hasStandardNestedCollection(
  field: ParquetField,
  arrowType: arrow.DataType
): boolean {
  if (field.logicalType?.type === 'LIST' && arrowType instanceof arrow.List) {
    return Boolean(field.fields?.list?.fields?.element);
  }
  if (field.logicalType?.type === 'MAP' && arrowType instanceof arrow.Map_) {
    return Boolean(field.fields?.key_value?.fields?.key && field.fields.key_value.fields.value);
  }
  const valueType =
    field.repetitionType === 'REPEATED' && arrowType instanceof arrow.List
      ? arrowType.children[0].type
      : arrowType;
  return (
    valueType instanceof arrow.Struct &&
    valueType.children.some(child => {
      const parquetChild = field.fields?.[child.name];
      return parquetChild && hasStandardNestedCollection(parquetChild, child.type);
    })
  );
}

/** Normalizes standard Parquet LIST/MAP wrappers and absent values before Arrow conversion. */
export function normalizeNestedParquetValue(
  value: unknown,
  field: ParquetField,
  arrowType: arrow.DataType
): unknown {
  // Materialization omits absent optional fields; Arrow builders recognize null, not undefined.
  if (value === undefined || value === null) {
    return null;
  }
  if (!field.fields) {
    return value;
  }

  if (
    field.repetitionType === 'REPEATED' &&
    arrowType instanceof arrow.List &&
    Array.isArray(value)
  ) {
    return value.map(element =>
      normalizeNestedParquetValue(element, field, arrowType.children[0].type)
    );
  }

  if (field.logicalType?.type === 'LIST' && arrowType instanceof arrow.List) {
    const listField = field.fields.list;
    const elementField = listField?.fields?.element;
    if (!listField || !elementField) {
      return value;
    }
    const listValue = value && typeof value === 'object' ? Reflect.get(value, 'list') : undefined;
    if (!Array.isArray(listValue)) {
      return [];
    }
    return listValue.map(element =>
      normalizeNestedParquetValue(
        element && typeof element === 'object' ? Reflect.get(element, 'element') : element,
        elementField,
        arrowType.children[0].type
      )
    );
  }

  if (field.logicalType?.type === 'MAP' && arrowType instanceof arrow.Map_) {
    const entryField = field.fields.key_value;
    const keyField = entryField?.fields?.key;
    const valueField = entryField?.fields?.value;
    if (!entryField || !keyField || !valueField) {
      const legacyValueField = field.fields.value;
      return legacyValueField && typeof value === 'object'
        ? new Map([
            [
              Reflect.get(value, 'key'),
              normalizeNestedParquetValue(
                Reflect.get(value, 'value'),
                legacyValueField,
                arrowType.children[0].type.children[1].type
              )
            ]
          ])
        : value;
    }
    const entries =
      value && typeof value === 'object' ? Reflect.get(value, 'key_value') : undefined;
    if (!Array.isArray(entries)) {
      return new Map();
    }
    return new Map(
      entries.map(entry => [
        Reflect.get(entry, 'key'),
        normalizeNestedParquetValue(
          Reflect.get(entry, 'value'),
          valueField,
          arrowType.children[0].type.children[1].type
        )
      ])
    );
  }

  if (typeof value !== 'object' || Array.isArray(value) || ArrayBuffer.isView(value)) {
    return value;
  }
  const normalized: Record<string, unknown> = {};
  for (const [name, childField] of Object.entries(field.fields)) {
    const childType = arrowType.children?.find(child => child.name === name)?.type;
    normalized[name] = childType
      ? normalizeNestedParquetValue(Reflect.get(value, name), childField, childType)
      : Reflect.get(value, name);
  }
  return normalized;
}
