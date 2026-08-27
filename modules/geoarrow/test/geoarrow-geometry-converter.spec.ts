// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {
  GEOARROW_LINE_WKT_FILE,
  GEOARROW_POINT_FILE,
  GEOARROW_POINT_WKB_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import type {Feature} from '@loaders.gl/schema';
import {
  convertGeoArrowGeometry,
  convertGeoArrowToTable,
  convertFeaturesToGeoArrowTable,
  GeoArrowGeometryConverter,
  getGeometryColumnsFromSchema
} from '@loaders.gl/geoarrow';
import {convertArrowToSchema, convert} from '@loaders.gl/schema-utils';
/**
 * Loads an Apache Arrow table from a GeoArrow fixture.
 * @param filePath Fixture path alias.
 * @returns Parsed Arrow table.
 */
async function loadArrowTable(filePath: string): Promise<arrow.Table> {
  const file = await fetchFile(filePath);
  return arrow.tableFromIPC(await file.arrayBuffer());
}
/**
 * Rebuilds a table with GeoArrow field metadata on the geometry column.
 * @param table Source Arrow table.
 * @param encoding GeoArrow field encoding.
 * @returns Arrow table with updated geometry field metadata.
 */
function setGeometryFieldEncoding(table: arrow.Table, encoding: string): arrow.Table {
  const nextFields = table.schema.fields.map(field =>
    field.name === 'geometry'
      ? new arrow.Field(
          field.name,
          field.type,
          field.nullable,
          new Map([['ARROW:extension:name', encoding]])
        )
      : field
  );
  const nextSchema = new arrow.Schema(nextFields, table.schema.metadata);
  return new arrow.Table(
    new arrow.RecordBatch(
      nextSchema,
      arrow.makeData({
        type: new arrow.Struct(nextFields),
        length: table.numRows,
        nullCount: 0,
        children: nextFields.map(field => table.getChild(field.name)!.data[0])
      })
    )
  );
}
test('GeoArrowGeometryConverter converts WKB geometry columns to native point encoding', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.point');
  const convertedSchema = convertArrowToSchema(convertedTable.schema);
  expect(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'updates the geometry column encoding metadata'
  ).toBe('geoarrow.point');
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString(),
    'builds a native point column'
  ).toBe('FixedSizeList[2]<Float64>');
  expect(
    convertGeoArrowToTable(convertedTable, 'geojson-table').features,
    'preserves feature content after conversion'
  ).toEqual(convertGeoArrowToTable(table, 'geojson-table').features);
});
test('GeoArrowGeometryConverter converts native point encoding to WKT', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.wkt');
  const convertedSchema = convertArrowToSchema(convertedTable.schema);
  expect(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'updates the geometry column encoding metadata'
  ).toBe('geoarrow.wkt');
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString(),
    'builds a WKT geometry column'
  ).toBe('Utf8');
  expect(
    convertGeoArrowToTable(convertedTable, 'geojson-table').features,
    'preserves feature content after conversion'
  ).toEqual(convertGeoArrowToTable(table, 'geojson-table').features);
});
test('GeoArrowGeometryConverter converts only selected geometry columns', async () => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const lineTable = await loadArrowTable(GEOARROW_LINE_WKT_FILE);
  const geometryVector = pointTable.getChild('geometry')!;
  const secondaryGeometryVector = lineTable.getChild('geometry')!;
  const table = arrow.makeTable({
    id: pointTable.getChild('id')!,
    name: pointTable.getChild('name')!,
    geometry: geometryVector,
    geometry2: secondaryGeometryVector
  });
  const schema = new arrow.Schema([
    pointTable.schema.fields.find(field => field.name === 'id')!,
    pointTable.schema.fields.find(field => field.name === 'name')!,
    pointTable.schema.fields.find(field => field.name === 'geometry')!,
    new arrow.Field(
      'geometry2',
      secondaryGeometryVector.type,
      true,
      new Map([['ARROW:extension:name', 'geoarrow.wkt']])
    )
  ]);
  const tableWithSchema = new arrow.Table(
    new arrow.RecordBatch(
      schema,
      arrow.makeData({
        type: new arrow.Struct(schema.fields),
        length: table.numRows,
        nullCount: 0,
        children: [
          table.getChild('id')!.data[0],
          table.getChild('name')!.data[0],
          table.getChild('geometry')!.data[0],
          table.getChild('geometry2')!.data[0]
        ]
      })
    )
  );
  const convertedTable = convertGeoArrowGeometry(tableWithSchema, 'geoarrow.point', {
    geometryColumn: 'geometry'
  });
  const convertedSchema = convertArrowToSchema(convertedTable.schema);
  const convertedGeometryColumns = getGeometryColumnsFromSchema(convertedSchema);
  expect(convertedGeometryColumns.geometry?.encoding, 'converts the selected column').toBe(
    'geoarrow.point'
  );
  expect(convertedGeometryColumns.geometry2?.encoding, 'leaves unselected columns alone').toBe(
    'geoarrow.wkt'
  );
});
test('GeoArrowGeometryConverter rejects incompatible target encodings', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  expect(
    () => convertGeoArrowGeometry(table, 'geoarrow.linestring'),
    'rejects changing geometry type during encoding conversion'
  ).toThrow(/cannot encode Point as geoarrow\.linestring/i);
});
test('GeoArrowGeometryConverter integrates with convert()', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const convertedTable = convert(table, 'geoarrow.point', [GeoArrowGeometryConverter]);
  const convertedSchema = convertArrowToSchema((convertedTable as arrow.Table).schema);
  expect(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'supports schema-utils convert() integration'
  ).toBe('geoarrow.point');
});
test('GeoArrowGeometryConverter converts mixed WKB tables to geoarrow.geometry', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {name: 'point'},
      geometry: {type: 'Point', coordinates: [1, 2]}
    },
    {
      type: 'Feature',
      properties: {name: 'line'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    }
  ];
  const table = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.geometry');
  const roundTripTable = convertGeoArrowGeometry(convertedTable, 'geoarrow.wkt');
  expect(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get('ARROW:extension:name'),
    'updates geometry metadata to geoarrow.geometry'
  ).toBe('geoarrow.geometry');
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.constructor.name,
    'builds a dense union geometry column'
  ).toBe('DenseUnion');
  expect(
    convertGeoArrowToTable(roundTripTable, 'geojson-table').features,
    'round-trips mixed geometry content through the union encoding'
  ).toEqual(features);
});
test('GeoArrowGeometryConverter converts geometry collections to geoarrow.geometrycollection', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {name: 'collection'},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [1, 2]},
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1]
            ]
          }
        ]
      }
    }
  ];
  const table = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkt'}}).data,
    'geoarrow.wkt'
  );
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.geometrycollection');
  const roundTripTable = convertGeoArrowGeometry(convertedTable, 'geoarrow.wkb');
  expect(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get('ARROW:extension:name'),
    'updates geometry metadata to geoarrow.geometrycollection'
  ).toBe('geoarrow.geometrycollection');
  expect(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.type.toString()
      .startsWith('List<Union<'),
    'builds a list of dense union members for geometry collections'
  ).toBeTruthy();
  expect(
    convertGeoArrowToTable(roundTripTable, 'geojson-table').features,
    'round-trips geometry collections through the collection encoding'
  ).toEqual(features);
});
