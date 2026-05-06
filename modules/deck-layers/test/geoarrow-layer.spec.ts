// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {
  GEOARROW_LINE_FILE,
  GEOARROW_MULTILINE_FILE,
  GEOARROW_POINT_FILE,
  GEOARROW_POINT_WKB_FILE,
  GEOARROW_POLYGON_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import {
  convertGeoArrowTableToBinaryFeatureCollection,
  GeoArrowLayer,
  type GeoArrowLayerProps
} from '@loaders.gl/deck-layers';
import type {ArrowTable} from '@loaders.gl/schema';
import {GeoJsonLayer} from '@deck.gl/layers';

/**
 * Loads an Apache Arrow table from a GeoArrow test fixture.
 * @param filePath Fixture path alias.
 * @returns Parsed Apache Arrow table.
 */
async function loadArrowTable(filePath: string): Promise<arrow.Table> {
  const file = await fetchFile(filePath);
  return arrow.tableFromIPC(await file.arrayBuffer());
}

/**
 * Creates a GeoArrow layer instance for testing.
 * @param props GeoArrow layer props.
 * @returns A GeoArrow layer instance.
 */
function createLayer(props: GeoArrowLayerProps): GeoArrowLayer {
  return new GeoArrowLayer({
    id: 'test-geoarrow-layer',
    ...props
  });
}

/**
 * Normalizes a layer render result to an array.
 * @param layerResult Layer render result.
 * @returns Array of rendered sublayers.
 */
function asLayerArray(layerResult: ReturnType<GeoArrowLayer['renderLayers']>) {
  if (!layerResult) {
    return [];
  }
  return Array.isArray(layerResult) ? layerResult : [layerResult];
}

test('GeoArrowLayer renders GeoJsonLayer binary data for point data', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const layer = createLayer({data: table});
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.ok(sublayer instanceof GeoJsonLayer, 'creates a GeoJsonLayer');
  t.equal(
    (sublayer as GeoJsonLayer).props.data.points.positions.value.length,
    4,
    'passes point binary feature data'
  );
  t.end();
});

test('GeoArrowLayer renders GeoJsonLayer binary data for multiline data', async t => {
  const table = await loadArrowTable(GEOARROW_MULTILINE_FILE);
  const layer = createLayer({data: table});
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.ok(sublayer instanceof GeoJsonLayer, 'creates a GeoJsonLayer');
  t.deepEqual(
    Array.from((sublayer as GeoJsonLayer).props.data.lines.pathIndices.value),
    [0, 2, 4, 6, 8],
    'passes exploded path indices'
  );
  t.end();
});

test('GeoArrowLayer renders GeoJsonLayer binary data for polygon data', async t => {
  const table = await loadArrowTable(GEOARROW_POLYGON_FILE);
  const layer = createLayer({data: table});
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.ok(sublayer instanceof GeoJsonLayer, 'creates a GeoJsonLayer');
  t.equal(
    (sublayer as GeoJsonLayer).props.data.polygons.positions.size,
    2,
    'passes polygon binary feature data'
  );
  t.end();
});

test('GeoArrowLayer respects explicit geometryColumn override', async t => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_FILE);
  const lineTable = await loadArrowTable(GEOARROW_LINE_FILE);
  const table = new arrow.Table(
    new arrow.RecordBatch(
      new arrow.Schema(
        [
          pointTable.schema.fields.find(field => field.name === 'id')!,
          pointTable.schema.fields.find(field => field.name === 'name')!,
          pointTable.schema.fields.find(field => field.name === 'geometry')!,
          new arrow.Field(
            'geometry2',
            lineTable.schema.fields.find(field => field.name === 'geometry')!.type,
            true,
            lineTable.schema.fields.find(field => field.name === 'geometry')!.metadata
          )
        ],
        pointTable.schema.metadata
      ),
      arrow.makeData({
        type: new arrow.Struct([
          pointTable.schema.fields.find(field => field.name === 'id')!,
          pointTable.schema.fields.find(field => field.name === 'name')!,
          pointTable.schema.fields.find(field => field.name === 'geometry')!,
          new arrow.Field(
            'geometry2',
            lineTable.schema.fields.find(field => field.name === 'geometry')!.type,
            true,
            lineTable.schema.fields.find(field => field.name === 'geometry')!.metadata
          )
        ]),
        length: pointTable.numRows,
        nullCount: 0,
        children: [
          pointTable.getChild('id')!.data[0],
          pointTable.getChild('name')!.data[0],
          pointTable.getChild('geometry')!.data[0],
          lineTable.getChild('geometry')!.data[0]
        ]
      })
    )
  );
  const layer = createLayer({data: table, geometryColumn: 'geometry2'});
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.ok((sublayer as GeoJsonLayer).props.data.lines, 'uses the explicitly selected geometry column');
  t.end();
});

test('GeoArrowLayer throws when no geometry metadata is present', t => {
  const table = arrow.tableFromArrays({
    longitude: [1, 2],
    latitude: [3, 4]
  });
  const layer = createLayer({data: table});

  t.throws(
    () => layer.renderLayers(),
    /requires exactly one GeoArrow geometry column, but none were found/i,
    'rejects tables without GeoArrow metadata'
  );
  t.end();
});

test('GeoArrowLayer renders WKB point data through the GeoJsonLayer binary path', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const layer = createLayer({data: table});
  const sublayers = asLayerArray(layer.renderLayers());

  t.equal(sublayers.length, 1, 'renders a single sublayer for WKB points');
  t.ok(sublayers[0] instanceof GeoJsonLayer, 'creates a GeoJsonLayer');
  t.ok(sublayers[0].props.data.points, 'converts WKB point data to binary point data');
  t.end();
});

test('GeoArrowLayer renders geometry collections as multiple primitive sublayers', t => {
  const geometryTable = arrow.tableFromArrays({
    geometry: ['GEOMETRYCOLLECTION (POINT (1 2), LINESTRING (0 0, 1 1))']
  });
  const schema = new arrow.Schema(
    [
      new arrow.Field(
        'geometry',
        new arrow.Utf8(),
        true,
        new Map([['ARROW:extension:name', 'geoarrow.wkt']])
      )
    ],
    new Map([
      [
        'geo',
        JSON.stringify({
          version: '1.1.0',
          primary_column: 'geometry',
          columns: {
            geometry: {
              encoding: 'wkt',
              geometry_types: ['GeometryCollection']
            }
          }
        })
      ]
    ])
  );
  const table = new arrow.Table(
    new arrow.RecordBatch(
      schema,
      arrow.makeData({
        type: new arrow.Struct(schema.fields),
        length: geometryTable.numRows,
        nullCount: 0,
        children: [geometryTable.getChild('geometry')!.data[0]]
      })
    )
  );
  const layer = createLayer({data: table});
  const sublayers = asLayerArray(layer.renderLayers());

  t.equal(sublayers.length, 1, 'renders one GeoJsonLayer sublayer');
  t.ok(sublayers[0].props.data.points, 'renders points from the geometry collection');
  t.ok(sublayers[0].props.data.lines, 'renders lines from the geometry collection');
  t.end();
});

test('GeoArrow adapter accepts loaders.gl ArrowTable wrappers', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const binaryFeatureCollection = convertGeoArrowTableToBinaryFeatureCollection({
    shape: 'arrow-table',
    data: table
  } as ArrowTable);

  t.equal(binaryFeatureCollection.shape, 'binary-feature-collection');
  t.ok(binaryFeatureCollection.points, 'converts wrapper input to binary point data');
  t.end();
});

test('GeoArrowLayer throws when multiple geometry columns are present without geometryColumn', async t => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_FILE);
  const lineTable = await loadArrowTable(GEOARROW_LINE_FILE);
  const table = new arrow.Table(
    new arrow.RecordBatch(
      new arrow.Schema(
        [
          pointTable.schema.fields.find(field => field.name === 'id')!,
          pointTable.schema.fields.find(field => field.name === 'name')!,
          pointTable.schema.fields.find(field => field.name === 'geometry')!,
          new arrow.Field(
            'geometry2',
            lineTable.schema.fields.find(field => field.name === 'geometry')!.type,
            true,
            lineTable.schema.fields.find(field => field.name === 'geometry')!.metadata
          )
        ],
        pointTable.schema.metadata
      ),
      arrow.makeData({
        type: new arrow.Struct([
          pointTable.schema.fields.find(field => field.name === 'id')!,
          pointTable.schema.fields.find(field => field.name === 'name')!,
          pointTable.schema.fields.find(field => field.name === 'geometry')!,
          new arrow.Field(
            'geometry2',
            lineTable.schema.fields.find(field => field.name === 'geometry')!.type,
            true,
            lineTable.schema.fields.find(field => field.name === 'geometry')!.metadata
          )
        ]),
        length: pointTable.numRows,
        nullCount: 0,
        children: [
          pointTable.getChild('id')!.data[0],
          pointTable.getChild('name')!.data[0],
          pointTable.getChild('geometry')!.data[0],
          lineTable.getChild('geometry')!.data[0]
        ]
      })
    )
  );
  const layer = createLayer({data: table});

  t.throws(
    () => layer.renderLayers(),
    /requires "geometryColumn" when multiple GeoArrow geometry columns are present/i,
    'rejects ambiguous tables'
  );
  t.end();
});
