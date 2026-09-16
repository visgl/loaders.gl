// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {
  GLTF_EXT_structural_metadata_Class,
  GLTF_EXT_structural_metadata_PropertyTable
} from '@loaders.gl/gltf';

/** A decoded row from a structural-metadata property table. */
export type StructuralMetadataRow = Record<string, unknown>;

/**
 * Reads one decoded property-table row without exposing the extension's column layout.
 *
 * The glTF extension decoder stores decoded columns on each property definition as `data`.
 * This helper applies class-level defaults and no-data sentinels while preserving typed-array
 * values for vector and array properties. It never decodes a binary buffer itself; callers must
 * parse the glTF with `gltf.loadBuffers` enabled first.
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
  for (const [propertyName, propertyDefinition] of Object.entries(properties)) {
    const classProperty = schemaClass?.properties?.[propertyName];
    const data = propertyDefinition.data;
    let value = readRowValue(data, rowIndex);
    if (isNoDataValue(value, classProperty?.noData)) {
      value = classProperty?.default;
    }
    if (value !== undefined) {
      row[propertyName] = value;
    }
  }
  return row;
}

/** Returns one row from a decoded column while preserving typed-array values. */
function readRowValue(data: unknown, rowIndex: number): unknown {
  if (Array.isArray(data) || ArrayBuffer.isView(data)) {
    return data[rowIndex];
  }
  return undefined;
}

/** Compares decoded scalar/vector values with a class-level no-data sentinel. */
function isNoDataValue(value: unknown, noData: unknown): boolean {
  if (noData === undefined || value === undefined) {
    return false;
  }
  if (Array.isArray(value) && Array.isArray(noData)) {
    return value.length === noData.length && value.every((item, index) => item === noData[index]);
  }
  return value === noData;
}
