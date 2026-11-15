// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Table,
  ObjectRowTable,
  ArrayRowTable,
  ColumnarTable,
  GeoJSONTable,
  ArrowTable
} from '@loaders.gl/core/schema';
import {isNativeArrowTable} from '../../../../lib/loader-utils/native-arrow';

/** Checks if a table is of array row layout */
export function isArrayRowTable(table: Table): table is ArrayRowTable {
  return table.shape === 'array-row-table';
}

/** Checks if a table is of array row layout */
export function isObjectRowTable(table: Table): table is ObjectRowTable {
  return table.shape === 'object-row-table';
}

/** Checks if a table is of columnar layout */
export function isColumnarTable(table: Table): table is ColumnarTable {
  return table.shape === 'columnar-table';
}

/** Checks if a table is of GeoJSON format */
export function isGeoJSONTable(table: Table): table is GeoJSONTable {
  return table.shape === 'geojson-table';
}

/** Identifies a native Apache Arrow table. */
export function isArrowTable(table: unknown): table is ArrowTable {
  return isNativeArrowTable(table);
}
