// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import {GeometryConverter} from '@loaders.gl/gis';
import type {Feature, Geometry, Table} from '@loaders.gl/schema';
import {
  convert,
  getTableLength,
  getTableNumCols,
  getTableRowAsArray
} from '@loaders.gl/schema-utils';

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
  const geometryIndex = table.schema?.fields.findIndex(field => field.name === 'geometry') ?? -1;
  if (geometryIndex > -1) {
    return geometryIndex;
  }

  // look at the data
  // TODO - this drags in the indices
  if (getTableLength(table) > 0) {
    const row = getTableRowAsArray(table, 0);
    for (let columnIndex = 0; columnIndex < getTableNumCols(table); columnIndex++) {
      const value = row?.[columnIndex];
      if (
        value &&
        (typeof value === 'object' ||
          (typeof value === 'string' && parseGeometryString(value) !== null))
      ) {
        return columnIndex;
      }
    }
  }

  throw new Error('Failed to detect geometry column');
}

/**
 * Parses a GeoJSON- or WKT-encoded geometry string.
 * @param value String containing a GeoJSON feature/geometry or WKT geometry.
 * @returns The parsed feature or geometry, or `null` when the string is not a supported geometry.
 */
export function parseGeometryString(value: string): Feature | Geometry | null {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    try {
      parsedValue = convert(value, 'geojson-geometry', GeometryConverter);
    } catch {
      return null;
    }
  }

  return isFeatureOrGeometry(parsedValue) ? parsedValue : null;
}

/** Returns whether a value looks like a GeoJSON feature or geometry. */
function isFeatureOrGeometry(value: unknown): value is Feature | Geometry {
  return (
    typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
  );
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
