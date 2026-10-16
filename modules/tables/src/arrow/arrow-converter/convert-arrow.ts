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
import {convertArrowToTable, convertTableToArrow} from '@loaders.gl/schema-utils';
import type {ArrowConvertFromOptions, ArrowConvertToOptions} from './arrow-converter';

/**
 * Converts between Apache Arrow tables and loaders.gl table shapes.
 */
export function convertArrow(input: arrow.Table, shape: 'arrow-table'): ArrowTable;
export function convertArrow(input: arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertArrow(input: arrow.Table, shape: 'object-row-table'): ObjectRowTable;
export function convertArrow(input: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertArrow(input: arrow.Table, shape: 'geojson-table'): GeoJSONTable;
export function convertArrow(
  input: Table,
  shape: 'arrow',
  options?: ArrowConvertFromOptions
): arrow.Table;
export function convertArrow(
  input: arrow.Table | Table,
  shape:
    | 'arrow'
    | 'object-row-table'
    | 'array-row-table'
    | 'columnar-table'
    | 'arrow-table'
    | 'geojson-table',
  options?: ArrowConvertFromOptions | ArrowConvertToOptions
): Table | arrow.Table {
  if (isApacheArrowTable(input)) {
    if (shape === 'arrow') {
      return input;
    }
    return convertArrowToTable(input, shape);
  }
  if (shape !== 'arrow') {
    throw new Error(`Unsupported Arrow conversion target: ${shape}`);
  }
  return convertTableToArrow(input, options as ArrowConvertFromOptions | undefined);
}

/**
 * Checks whether a value is an Apache Arrow table instance rather than a loaders.gl table wrapper.
 */
export function isApacheArrowTable(input: arrow.Table | Table): input is arrow.Table {
  return typeof input === 'object' && input !== null && !('shape' in input);
}
