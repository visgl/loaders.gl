// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
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

test('GeoArrowGeometryConverter converts WKB geometry columns to native point encoding', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.point');
  const convertedSchema = convertArrowToSchema(convertedTable.schema);

  t.equal(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'geoarrow.point',
    'updates the geometry column encoding metadata'
  );
  t.equal(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString(),
    'FixedSizeList[2]<Float64>',
    'builds a native point column'
  );
  t.deepEqual(
    convertGeoArrowToTable(convertedTable, 'geojson-table').features,
    convertGeoArrowToTable(table, 'geojson-table').features,
    'preserves feature content after conversion'
  );
  t.end();
});

test('GeoArrowGeometryConverter converts native point encoding to WKT', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.wkt');
  const convertedSchema = convertArrowToSchema(convertedTable.schema);

  t.equal(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'geoarrow.wkt',
    'updates the geometry column encoding metadata'
  );
  t.equal(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString(),
    'Utf8',
    'builds a WKT geometry column'
  );
  t.deepEqual(
    convertGeoArrowToTable(convertedTable, 'geojson-table').features,
    convertGeoArrowToTable(table, 'geojson-table').features,
    'preserves feature content after conversion'
  );
  t.end();
});

test('GeoArrowGeometryConverter converts only selected geometry columns', async t => {
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

  t.equal(
    convertedGeometryColumns.geometry?.encoding,
    'geoarrow.point',
    'converts the selected column'
  );
  t.equal(
    convertedGeometryColumns.geometry2?.encoding,
    'geoarrow.wkt',
    'leaves unselected columns alone'
  );
  t.end();
});

test('GeoArrowGeometryConverter rejects incompatible target encodings', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);

  t.throws(
    () => convertGeoArrowGeometry(table, 'geoarrow.linestring'),
    /cannot encode Point as geoarrow\.linestring/i,
    'rejects changing geometry type during encoding conversion'
  );
  t.end();
});

test('GeoArrowGeometryConverter integrates with convert()', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const convertedTable = convert(table, 'geoarrow.point', [GeoArrowGeometryConverter]);
  const convertedSchema = convertArrowToSchema((convertedTable as arrow.Table).schema);

  t.equal(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'geoarrow.point',
    'supports schema-utils convert() integration'
  );
  t.end();
});

test('GeoArrowGeometryConverter converts mixed WKB tables to geoarrow.geometry', t => {
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

  t.equal(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get('ARROW:extension:name'),
    'geoarrow.geometry',
    'updates geometry metadata to geoarrow.geometry'
  );
  t.equal(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.constructor.name,
    'DenseUnion',
    'builds a dense union geometry column'
  );
  t.deepEqual(
    convertGeoArrowToTable(roundTripTable, 'geojson-table').features,
    features,
    'round-trips mixed geometry content through the union encoding'
  );
  t.end();
});

test('GeoArrowGeometryConverter converts geometry collections to geoarrow.geometrycollection', t => {
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

  t.equal(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get('ARROW:extension:name'),
    'geoarrow.geometrycollection',
    'updates geometry metadata to geoarrow.geometrycollection'
  );
  t.ok(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.type.toString()
      .startsWith('List<Union<'),
    'builds a list of dense union members for geometry collections'
  );
  t.deepEqual(
    convertGeoArrowToTable(roundTripTable, 'geojson-table').features,
    features,
    'round-trips geometry collections through the collection encoding'
  );
  t.end();
});
