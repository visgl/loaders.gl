// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayRowTable, ObjectRowTable, GeoJSONTable, Schema} from '@loaders.gl/schema';
import {convertWKBTableToGeoJSON as convertWKBTableToGeoJSONInGIS} from '@loaders.gl/gis';

/**
 * Converts a WKB- or WKT-encoded table with geo metadata to GeoJSON features.
 */
export function convertWKBTableToGeoJSON(
  table: ArrayRowTable | ObjectRowTable,
  schema: Schema
): GeoJSONTable {
  return convertWKBTableToGeoJSONInGIS(table, schema);
}
