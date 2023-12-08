// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import {Table, getTableLength, getTableNumCols, getTableRowAsArray} from '@loaders.gl/schema';

type Row = {[key: string]: unknown};

/**
 * Attempts to identify which column contains geometry
 * Currently just returns name (key) of first object-valued column
 * @todo look for hints in schema metadata
 * @todo look for WKB
 */
export function detectGeometryColumnIndex(table: Table): number {
  // TODO - look for hints in schema metadata

  // look for a column named geometry
  const geometryIndex = table.schema?.fields.findIndex((field) => field.name === 'geometry') ?? -1;
  if (geometryIndex > -1) {
    return geometryIndex;
  }

  // look at the data
  // TODO - this drags in the indices
  if (getTableLength(table) > 0) {
    const row = getTableRowAsArray(table, 0);
    for (let columnIndex = 0; columnIndex < getTableNumCols(table); columnIndex++) {
      const value = row?.[columnIndex];
      if (value && typeof value === 'object') {
        return columnIndex;
      }
    }
  }

  throw new Error('Failed to detect geometry column');
}

/**
 * Return a row as a property (key/value) object, excluding selected columns
 */
export function getRowPropertyObject(
  table: Table,
  row: Row,
  excludeColumnIndices: number[] = []
): {[columnName: string]: unknown} {
  const properties = {};
  for (let columnIndex = 0; columnIndex < getTableNumCols(table); ++columnIndex) {
    const columnName = table.schema?.fields[columnIndex].name;
    if (columnName && !excludeColumnIndices.includes(columnIndex)) {
      properties[columnName] = row[columnName];
    }
  }
  return properties;
}
