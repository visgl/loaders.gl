// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {
  GLTF_EXT_structural_metadata_Class,
  GLTF_EXT_structural_metadata_ClassProperty,
  GLTF_EXT_structural_metadata_PropertyTable
} from '@loaders.gl/gltf';

/** A decoded row from a structural-metadata property table. */
export type StructuralMetadataRow = Record<string, unknown>;

/**
 * Reads one decoded property-table row without exposing the extension's column layout.
 *
 * The glTF extension decoder stores transformed columns on each property definition as `data`
 * and preserves source-domain values as `rawData`. This helper checks `noData` against the raw
 * values before returning transformed values, applies class defaults for sentinels and omitted
 * optional columns, and preserves typed-array values for vector and array properties. It never
 * decodes a binary buffer itself; callers must parse the glTF with `gltf.loadBuffers` enabled.
 *
 * @param propertyTable - Decoded property table containing column data.
 * @param schemaClass - Class declaration supplying defaults and no-data values.
 * @param rowIndex - Zero-based row index.
 * @returns A decoded row, or `null` when the row is outside the table.
 */
export function getStructuralMetadataRow(
  propertyTable: GLTF_EXT_structural_metadata_PropertyTable,
  schemaClass: GLTF_EXT_structural_metadata_Class | undefined,
  rowIndex: number
): StructuralMetadataRow | null {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= propertyTable.count) {
    return null;
  }

  const row: StructuralMetadataRow = {};
  const properties = propertyTable.properties || {};
  const propertyNames = new Set([
    ...Object.keys(schemaClass?.properties || {}),
    ...Object.keys(properties)
  ]);

  for (const propertyName of propertyNames) {
    const propertyDefinition = properties[propertyName];
    const classProperty = schemaClass?.properties?.[propertyName];
    const data = propertyDefinition?.data;
    const rawData = propertyDefinition?.rawData;
    const value = readRowValue(data, rowIndex, classProperty);
    const rawValue = readRowValue(rawData ?? data, rowIndex, classProperty);

    if (isNoDataValue(rawValue, classProperty?.noData)) {
      if (classProperty?.default !== undefined) {
        row[propertyName] = classProperty.default;
      }
    } else if (value !== undefined) {
      row[propertyName] = value;
    } else if (classProperty?.default !== undefined) {
      row[propertyName] = classProperty.default;
    }
  }
  return row;
}

/** Returns one row from a decoded column while preserving vector and array shapes. */
function readRowValue(
  data: unknown,
  rowIndex: number,
  classProperty: GLTF_EXT_structural_metadata_ClassProperty | undefined
): unknown {
  if (!isArrayLikeData(data)) {
    return undefined;
  }

  const componentCount = getMetadataComponentCount(classProperty?.type);
  if (!classProperty?.array && componentCount > 1) {
    const start = rowIndex * componentCount;
    return (data as {slice(start: number, end: number): unknown}).slice(
      start,
      start + componentCount
    );
  }
  return (data as ArrayLike<unknown>)[rowIndex];
}

/** Compares decoded source-domain values with a class-level no-data sentinel. */
function isNoDataValue(value: unknown, noData: unknown): boolean {
  if (noData === undefined || value === undefined) {
    return false;
  }
  const valueArray = getArrayLikeValues(value);
  const noDataArray = getArrayLikeValues(noData);
  if (valueArray && noDataArray) {
    return (
      valueArray.length === noDataArray.length &&
      Array.from(valueArray).every((item, index) => item === noDataArray[index])
    );
  }
  return value === noData;
}

/** Returns array-like values for normal and typed arrays. */
function getArrayLikeValues(value: unknown): ArrayLike<unknown> | null {
  return isArrayLikeData(value) ? (value as ArrayLike<unknown>) : null;
}

/** Identifies normal arrays and typed arrays with indexed values. */
function isArrayLikeData(value: unknown): boolean {
  return (
    Array.isArray(value) ||
    (ArrayBuffer.isView(value) && 'length' in value && typeof value.length === 'number')
  );
}

/** Returns the number of scalar components represented by a metadata element type. */
function getMetadataComponentCount(attributeType: string | undefined): number {
  switch (attributeType) {
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    case 'MAT2':
      return 4;
    case 'MAT3':
      return 9;
    case 'MAT4':
      return 16;
    default:
      return 1;
  }
}


/**
 * Reads one named value from a decoded structural-metadata property-table row.
 *
 * This helper is intentionally a thin convenience wrapper around
 * `getStructuralMetadataRow`. It does not evaluate styles, map feature IDs, or decode buffers;
 * callers must provide a property table whose columns were already decoded by glTF parsing.
 *
 * @param propertyTable - Decoded property table containing column data.
 * @param schemaClass - Class declaration supplying defaults and no-data values.
 * @param rowIndex - Zero-based feature row index.
 * @param propertyName - Property name to read.
 * @returns The decoded property value, or `undefined` when the row/property is absent.
 */
export function getStructuralMetadataProperty(
  propertyTable: GLTF_EXT_structural_metadata_PropertyTable,
  schemaClass: GLTF_EXT_structural_metadata_Class | undefined,
  rowIndex: number,
  propertyName: string
): unknown {
  return getStructuralMetadataRow(propertyTable, schemaClass, rowIndex)?.[propertyName];
}
