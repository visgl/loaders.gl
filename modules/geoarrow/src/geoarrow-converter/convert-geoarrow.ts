// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {
  Table,
  ArrayRowTable,
  ObjectRowTable,
  ColumnarTable,
  ArrowTable,
  GeoJSONTable
} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {convertGeoArrowToTable} from '../lib/table-converters/convert-geoarrow-table';
import {convertTableToGeoArrow} from '../convert-table-to-geoarrow';
import {getGeometryColumnsFromSchema} from '../metadata/geoarrow-metadata';
import type {GeoArrowConvertFromOptions, GeoArrowConvertToOptions} from './geoarrow-converter';

/**
 * Converts between GeoArrow Arrow tables and loaders.gl table shapes.
 */
export function convertGeoArrow(input: arrow.Table, shape: 'arrow-table'): ArrowTable;
export function convertGeoArrow(input: arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertGeoArrow(input: arrow.Table, shape: 'object-row-table'): ObjectRowTable;
export function convertGeoArrow(input: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertGeoArrow(input: arrow.Table, shape: 'geojson-table'): GeoJSONTable;
export function convertGeoArrow(
  input: Table,
  shape: 'geoarrow',
  options?: GeoArrowConvertFromOptions
): arrow.Table;
export function convertGeoArrow(
  input: arrow.Table | Table,
  shape:
    | 'geoarrow'
    | 'object-row-table'
    | 'array-row-table'
    | 'columnar-table'
    | 'geojson-table'
    | 'arrow-table',
  options?: GeoArrowConvertFromOptions | GeoArrowConvertToOptions
): Table | arrow.Table {
  if (isGeoArrowApacheTable(input)) {
    if (shape === 'geoarrow') {
      return input;
    }
    return convertGeoArrowToTable(input, shape);
  }
  if (shape !== 'geoarrow') {
    throw new Error(`Unsupported GeoArrow conversion target: ${shape}`);
  }
  return convertTableToGeoArrow(input, options as GeoArrowConvertFromOptions | undefined);
}

/**
 * Checks whether a value is an Arrow table with GeoArrow metadata.
 */
export function isGeoArrowApacheTable(input: arrow.Table | Table): input is arrow.Table {
  if (typeof input !== 'object' || input === null || 'shape' in input) {
    return false;
  }
  const schema = convertArrowToSchema((input as arrow.Table).schema);
  const geometryColumns = getGeometryColumnsFromSchema(schema);
  return Object.keys(geometryColumns).length > 0;
}
