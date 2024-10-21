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
  ArrowTable,
  Feature
} from '@loaders.gl/schema';

import {
  convertTable,
  convertArrowToSchema,
  convertSchemaToArrow,
  getTableLength,
  getTableNumCols,
  getTableCellAt
} from '@loaders.gl/schema-utils';
import {getGeometryColumnsFromSchemaMetadata} from '../geoarrow/geoarrow-metadata';
import {convertGeoArrowGeometryToGeoJSON} from '../geometry-converters/convert-geoarrow-to-geojson';

/**
 * * Convert a loaders.gl Table to an Apache Arrow Table
 * @param mesh
 * @param metadata
 * @param batchSize
 * @returns
 */
export function convertTableToArrow(table: Table, options?: {batchSize?: number}): arrow.Table {
  switch (table.shape) {
    case 'arrow-table':
      return table.data;

    case 'columnar-table':
    // TODO - optimized implementation is possible
    // return convertColumnarTableToArrow(table, options);

    // fall through

    default:
      const arrowBatchIterator = makeTableToArrowBatchesIterator(table, options);
      return new arrow.Table(arrowBatchIterator);
  }
}

export function* makeTableToArrowBatchesIterator(
  table: Table,
  options?: {batchSize?: number}
): IterableIterator<arrow.RecordBatch> {
  const arrowSchema = convertSchemaToArrow(table.schema!);

  const length = getTableLength(table);
  const numColumns = getTableNumCols(table);
  const batchSize = options?.batchSize || length;

  const builders = arrowSchema?.fields.map((arrowField) => arrow.makeBuilder(arrowField));
  const structField = new arrow.Struct(arrowSchema.fields);

  let batchLength = 0;
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    for (let columnIndex = 0; columnIndex < numColumns; ++columnIndex) {
      const value = getTableCellAt(table, rowIndex, columnIndex);

      const builder = builders[columnIndex];
      builder.append(value);
      batchLength++;

      if (batchLength >= batchSize) {
        const datas = builders.map((builder) => builder.flush());
        const structData = new arrow.Data(structField, 0, batchLength, 0, undefined, datas);
        yield new arrow.RecordBatch(arrowSchema, structData);
        batchLength = 0;
      }
    }
  }

  if (batchLength > 0) {
    const datas = builders.map((builder) => builder.flush());
    const structData = new arrow.Data(structField, 0, batchLength, 0, undefined, datas);
    yield new arrow.RecordBatch(arrowSchema, structData);
    batchLength = 0;
  }

  builders.map((builder) => builder.finish());
}

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertGeoArrowToTable(arrow: arrow.Table, shape: 'arrow-table'): ArrowTable;
export function convertGeoArrowToTable(arrow: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertGeoArrowToTable(
  arrow: arrow.Table,
  shape: 'object-row-table'
): ObjectRowTable;
export function convertGeoArrowToTable(arrow: arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertGeoArrowToTable(arrow: arrow.Table, shape: 'geojson-table'): GeoJSONTable;
export function convertGeoArrowToTable(arrow: arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertGeoArrowToTable(arrow: arrow.Table, shape: Table['shape']): Table;

/**
 * Convert an Apache Arrow table to a loaders.gl Table
 * @note Currently does not convert schema
 */
export function convertGeoArrowToTable(arrowTable: arrow.Table, shape: Table['shape']): Table {
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
  const geometryColumns = getGeometryColumnsFromSchemaMetadata(schema);

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
    const feature = convertGeoArrowGeometryToGeoJSON(arrowGeometry, encoding);
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
