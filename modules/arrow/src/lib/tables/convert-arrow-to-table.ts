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
} from '@loaders.gl/schema';
import type {ArrowTable} from '../../schema/arrow-table-type';

import {convertTable} from '@loaders.gl/schema';
import {getGeometryColumnsFromSchema} from '@loaders.gl/gis';
import {convertArrowToSchema} from '../tables/convert-arrow-schema';
import {parseGeometryFromArrow} from '../geoarrow/convert-geoarrow-to-geojson-geometry';

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertArrowToTable(arrow: arrow.Table, shape: 'arrow-table'): ArrowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'object-row-table'): ObjectRowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'geojson-table'): GeoJSONTable;
export function convertArrowToTable(arrow: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertArrowToTable(arrow: arrow.Table, shape: Table['shape']): Table;

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertArrowToTable(arrowTable: arrow.Table, shape: Table['shape']): Table {
  switch (shape) {
    case 'arrow-table':
      return convertArrowToArrowTable(arrowTable);
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

/**
 * Wrap an apache arrow table in a loaders.gl table wrapper.
 * From this additional conversions are available.
 * @param arrowTable
 * @returns
 */
function convertArrowToArrowTable(arrowTable: arrow.Table): ArrowTable {
  return {
    shape: 'arrow-table',
    schema: convertArrowToSchema(arrowTable.schema),
    data: arrowTable
  };
}

function convertArrowToArrayRowTable(arrowTable: arrow.Table): Table {
  const columnarTable = convertArrowToColumnarTable(arrowTable);
  return convertTable(columnarTable, 'array-row-table');
}

function convertArrowToObjectRowTable(arrowTable: arrow.Table): Table {
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
  const geometryColumns = getGeometryColumnsFromSchema(schema);

  // get encoding from geometryColumns['geometry']
  const encoding = geometryColumns.geometry.encoding;

  const features: Feature[] = [];

  // Remove geometry columns
  const propertyColumnNames = arrowTable.schema.fields
    .map((field) => field.name)
    // TODO - this deletes all geometry columns
    .filter((name) => !(name in geometryColumns));
  const propertiesTable = arrowTable.select(propertyColumnNames);

  const arrowGeometryColumn = arrowTable.getChild('geometry');

  for (let row = 0; row < arrowTable.numRows; row++) {
    // get the geometry value from arrow geometry column
    // Note that type can vary
    const arrowGeometry = arrowGeometryColumn?.get(row);
    // parse arrow geometry to geojson feature
    const feature = parseGeometryFromArrow(arrowGeometry, encoding);
    if (feature) {
      const properties = propertiesTable.get(row)?.toJSON() || {};
      features.push({type: 'Feature', geometry: feature, properties});
    }
  }

  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    schema,
    features
  };
}
