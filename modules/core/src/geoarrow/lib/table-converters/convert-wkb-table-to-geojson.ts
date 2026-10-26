// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayRowTable, ObjectRowTable, GeoJSONTable, Schema} from '@loaders.gl/core/schema';
import {convertWKBTableToGeoJSON as convertWKBTableToGeoJSONImplementation} from '@loaders.gl/core/arrow-geometry/wkb-table';

/**
 * Converts a WKB- or WKT-encoded table with geo metadata to GeoJSON features.
 */
export function convertWKBTableToGeoJSON(
  table: ArrayRowTable | ObjectRowTable,
  schema: Schema
): GeoJSONTable {
  return convertWKBTableToGeoJSONImplementation(table, schema);
}
