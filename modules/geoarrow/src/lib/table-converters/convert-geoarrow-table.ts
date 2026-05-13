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
import {convertTable, convertArrowToSchema} from '@loaders.gl/schema-utils';
import {getGeometryColumnsFromSchema} from '../../metadata/geoarrow-metadata';
import {getGeoMetadata} from '../../metadata/geoparquet-metadata';
import {convertGeoArrowGeometryToGeoJSON} from '../geometry-converters/convert-geoarrow-to-geojson';

export function convertGeoArrowToTable(arrowTable: arrow.Table, shape: 'arrow-table'): ArrowTable;
export function convertGeoArrowToTable(
  arrowTable: arrow.Table,
  shape: 'columnar-table'
): ColumnarTable;
export function convertGeoArrowToTable(
  arrowTable: arrow.Table,
  shape: 'object-row-table'
): ObjectRowTable;
export function convertGeoArrowToTable(
  arrowTable: arrow.Table,
  shape: 'array-row-table'
): ArrayRowTable;
export function convertGeoArrowToTable(
  arrowTable: arrow.Table,
  shape: 'geojson-table'
): GeoJSONTable;
export function convertGeoArrowToTable(arrowTable: arrow.Table, shape: Table['shape']): Table;

/**
 * Converts an Apache Arrow table with GeoArrow metadata to a loaders.gl table shape.
 */
export function convertGeoArrowToTable(arrowTable: arrow.Table, shape: Table['shape']): Table {
  switch (shape) {
    case 'arrow-table':
      return {
        shape: 'arrow-table',
        schema: convertArrowToSchema(arrowTable.schema),
        data: arrowTable
      };
    case 'array-row-table':
      return convertTable(convertArrowToColumnarTable(arrowTable), 'array-row-table');
    case 'object-row-table':
      return convertTable(convertArrowToColumnarTable(arrowTable), 'object-row-table');
    case 'columnar-table':
      return convertArrowToColumnarTable(arrowTable);
    case 'geojson-table':
      return convertArrowToGeoJSONTable(arrowTable);
    default:
      throw new Error(shape);
  }
}

function convertArrowToColumnarTable(arrowTable: arrow.Table): ColumnarTable {
  const columns: ColumnarTable['data'] = {};

  for (const field of arrowTable.schema.fields) {
    columns[field.name] = arrowTable.getChild(field.name)?.toArray();
  }

  return {
    shape: 'columnar-table',
    schema: convertArrowToSchema(arrowTable.schema),
    data: columns
  };
}

function convertArrowToGeoJSONTable(arrowTable: arrow.Table): GeoJSONTable {
  const schema = convertArrowToSchema(arrowTable.schema);
  const geometryColumns = getGeometryColumnsFromSchema(schema);
  const geoMetadata = getGeoMetadata(schema.metadata);
  const primaryColumnName = geoMetadata?.primary_column;
  const geometryColumnName =
    (primaryColumnName && geometryColumns[primaryColumnName] && primaryColumnName) ||
    Object.keys(geometryColumns)[0];
  const geometryColumnMetadata =
    (geometryColumnName && geometryColumns[geometryColumnName]) || undefined;

  if (!geometryColumnName || !geometryColumnMetadata?.encoding) {
    throw new Error('No GeoArrow geometry column found in schema');
  }

  const features: Feature[] = [];
  const propertyColumnNames = arrowTable.schema.fields
    .map(field => field.name)
    .filter(name => !(name in geometryColumns));
  const propertiesTable = arrowTable.select(propertyColumnNames);
  const arrowGeometryColumn = arrowTable.getChild(geometryColumnName);

  for (let rowIndex = 0; rowIndex < arrowTable.numRows; rowIndex++) {
    const featureGeometry = convertGeoArrowGeometryToGeoJSON(
      arrowGeometryColumn?.get(rowIndex),
      geometryColumnMetadata.encoding
    );
    if (featureGeometry) {
      features.push({
        type: 'Feature',
        geometry: featureGeometry,
        properties: propertiesTable.get(rowIndex)?.toJSON() || {}
      });
    }
  }

  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    schema,
    features
  };
}
