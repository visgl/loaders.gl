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
import {makeWrappedTableRecordBatchIterator} from '../batches/make-arrow-batch-iterator';

/**
 * Converts a loaders.gl table to native Arrow and preserves the schema on empty input.
 * Native Arrow inputs and legacy wrapped Arrow columns are reused.
 */
export function convertTableToArrow(
  table: Table | arrow.Table,
  options?: {batchSize?: number}
): arrow.Table {
  if (!('shape' in table)) return table;
  switch (table.shape) {
    case 'arrow-table':
      return table.data;

    case 'columnar-table':
    // TODO - optimized implementation is possible
    // return convertColumnarTableToArrow(table, options);

    // fall through

    default:
      const schema = table.schema ?? deduceTableSchema(table);
      return new arrow.Table(convertSchemaToArrow(schema), [
        ...makeWrappedTableRecordBatchIterator({...table, schema}, options)
      ]);
  }
}

/** Loader table layouts produced when converting from Arrow. */
type NonArrowTable = Exclude<Table, {shape: 'arrow-table'}>;
type NonArrowTableShape = NonArrowTable['shape'];

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertArrowToTable(arrow: arrow.Table, shape: 'arrow'): arrow.Table;
export function convertArrowToTable(arrow: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'object-row-table'): ObjectRowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'geojson-table'): GeoJSONTable;
export function convertArrowToTable(arrow: arrow.Table, shape: NonArrowTableShape): NonArrowTable;

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertArrowToTable(
  arrowTable: arrow.Table,
  shape: NonArrowTableShape | 'arrow'
): NonArrowTable | arrow.Table {
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
    const values = arrowColumn?.toArray();
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

// /**
//  * Wrap an apache arrow table in a loaders.gl table wrapper.
//  * From this additional conversions are available.
//  * @param arrowTable
//  * @returns
//  */
// function convertArrowToArrowTable(arrowTable: arrow.Table): ArrowTable {
//   return {
//     shape: 'arrow-table',
//     schema: convertArrowToSchema(arrowTable.schema),
//     data: arrowTable
//   };
// }

// function convertArrowToArrayRowTable(arrowTable: arrow.Table): ArrayRowTable {
//   const columnarTable = convertArrowToColumnarTable(arrowTable);
//   return convertTable(columnarTable, 'array-row-table');
// }

// function convertArrowToObjectRowTable(arrowTable: arrow.Table): ObjectRowTable {
//   const columnarTable = convertArrowToColumnarTable(arrowTable);
//   return convertTable(columnarTable, 'object-row-table');
// }

// /**
//  * Convert an Apache Arrow table to a ColumnarTable
//  * @note Currently does not convert schema
//  */
// function convertArrowToColumnarTable(arrowTable: arrow.Table): ColumnarTable {
//   // TODO - avoid calling `getColumn` on columns we are not interested in?
//   // Add options object?

//   const columns: ColumnarTable['data'] = {};

//   for (const field of arrowTable.schema.fields) {
//     // This (is intended to) coalesce all record batches into a single typed array
//     const arrowColumn = arrowTable.getChild(field.name);
//     const values = arrowColumn?.toArray();
//     columns[field.name] = values;
//   }

//   const schema = convertArrowToSchema(arrowTable.schema);

//   return {
//     shape: 'columnar-table',
//     schema,
//     data: columns
//   };
// }
