// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  Table,
  ArrayRowTable,
  ColumnarTable,
  ObjectRowTable,
  GeoJSONTable,
  Feature
} from '@loaders.gl/core/schema';

import {convertTable} from './convert-table';
import {deduceTableSchema} from '../../schema/deduce-table-schema';
import {convertArrowToSchema, convertSchemaToArrow} from '../../schema/convert-arrow-schema';
import {makePortableTableRecordBatchIterator} from '../batches/make-arrow-batch-iterator';

/**
 * Converts a loaders.gl table to native Arrow and preserves the schema on empty input.
 * Native Arrow inputs retain their identity.
 */
export function convertTableToArrow(
  table: Table | arrow.Table,
  options?: {batchSize?: number}
): arrow.Table {
  if (!('shape' in table)) return table;
  const schema = table.schema ?? deduceTableSchema(table);
  return new arrow.Table(convertSchemaToArrow(schema), [
    ...makePortableTableRecordBatchIterator({...table, schema}, options)
  ]);
}

/** Loader table layouts produced when converting from Arrow. */
type NonArrowTableShape = Table['shape'];

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertArrowToTable(arrow: arrow.Table, shape: 'arrow'): arrow.Table;
export function convertArrowToTable(arrow: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'object-row-table'): ObjectRowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'geojson-table'): GeoJSONTable;
export function convertArrowToTable(arrow: arrow.Table, shape: NonArrowTableShape): Table;

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertArrowToTable(
  arrowTable: arrow.Table,
  shape: NonArrowTableShape | 'arrow'
): Table | arrow.Table {
  switch (shape) {
    case 'arrow':
      return arrowTable;
    case 'array-row-table':
      return convertArrowToArrayRowTable(arrowTable);
    case 'object-row-table':
      return convertArrowToObjectRowTable(arrowTable);
    case 'columnar-table':
      return convertArrowToColumnarTable(arrowTable);
    case 'geojson-table':
      return convertArrowToGeoJSONTable(arrowTable);
    default:
      throw new Error(shape);
  }
}

function convertArrowToArrayRowTable(arrowTable: arrow.Table): ArrayRowTable {
  const columnarTable = convertArrowToColumnarTable(arrowTable);
  return convertTable(columnarTable, 'array-row-table');
}

function convertArrowToObjectRowTable(arrowTable: arrow.Table): ObjectRowTable {
  const columnarTable = convertArrowToColumnarTable(arrowTable);
  return convertTable(columnarTable, 'object-row-table');
}

/**
 * Convert an Apache Arrow table to a ColumnarTable
 * @note Currently does not convert schema
 */
function convertArrowToColumnarTable(arrowTable: arrow.Table): ColumnarTable {
  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?

  const columns: ColumnarTable['data'] = {};

  for (const field of arrowTable.schema.fields) {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getChild(field.name);
    // Typed value buffers omit the validity bitmap; materialize nullable columns through Arrow.
    const values = arrowColumn?.nullCount ? Array.from(arrowColumn) : arrowColumn?.toArray();
    columns[field.name] = values;
  }

  const schema = convertArrowToSchema(arrowTable.schema);

  return {
    shape: 'columnar-table',
    schema,
    data: columns
  };
}

/**
 * Convert an Apache Arrow table to a GeoJSONTable
 * @note Currently does not convert schema
 */
function convertArrowToGeoJSONTable(arrowTable: arrow.Table): GeoJSONTable {
  const schema = convertArrowToSchema(arrowTable.schema);

  const features: Feature[] = [];

  for (let row = 0; row < arrowTable.numRows; row++) {
    // parse arrow geometry to geojson feature
    const properties = arrowTable.get(row)?.toJSON() || {};
    features.push({type: 'Feature', geometry: null!, properties});
  }

  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    schema,
    features
  };
}
