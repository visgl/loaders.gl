// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'test/utils/vitest-tape';
import {fetchFile} from '@loaders.gl/core';
import {
  GEOARROW_MULTILINE_FILE,
  GEOARROW_POINT_FILE,
  GEOARROW_POINT_WKB_FILE,
  GEOARROW_POLYGON_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import {
  convertGeoArrowTableToBinaryFeatureCollection,
  getApacheArrowTable,
  getGeoArrowGeometryColumn
} from '../src/geoarrow-table-adapter';

/** Loads an Apache Arrow table from a GeoArrow fixture. */
async function loadArrowTable(filePath: string): Promise<arrow.Table> {
  const file = await fetchFile(filePath);
  return arrow.tableFromIPC(await file.arrayBuffer());
}

test('GeoArrowTableAdapter#converts native point, line, and polygon tables', async t => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_FILE);
  const lineTable = await loadArrowTable(GEOARROW_MULTILINE_FILE);
  const polygonTable = await loadArrowTable(GEOARROW_POLYGON_FILE);

  const pointData = convertGeoArrowTableToBinaryFeatureCollection(pointTable);
  const lineData = convertGeoArrowTableToBinaryFeatureCollection(lineTable);
  const polygonData = convertGeoArrowTableToBinaryFeatureCollection(polygonTable);

  t.equal(pointData.shape, 'binary-feature-collection', 'point data is binary GeoJSON');
  t.ok(pointData.points?.positions.value.length, 'point positions are populated');
  t.equal(lineData.shape, 'binary-feature-collection', 'line data is binary GeoJSON');
  t.ok(lineData.lines?.pathIndices.value.length, 'line path indices are populated');
  t.equal(polygonData.shape, 'binary-feature-collection', 'polygon data is binary GeoJSON');
  t.ok(polygonData.polygons?.polygonIndices.value.length, 'polygon indices are populated');
  t.end();
});

test('GeoArrowTableAdapter#converts WKB tables and loaders.gl table wrappers', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const binaryData = convertGeoArrowTableToBinaryFeatureCollection({
    shape: 'arrow-table',
    data: table
  });

  t.equal(binaryData.shape, 'binary-feature-collection', 'wrapper data is binary GeoJSON');
  t.ok(binaryData.points?.positions.value.length, 'WKB point positions are populated');
  t.equal(getApacheArrowTable(table), table, 'raw Apache Arrow table is returned as-is');
  t.equal(
    getApacheArrowTable({shape: 'arrow-table', data: table}),
    table,
    'loaders.gl wrapper resolves to Apache Arrow table'
  );
  t.end();
});

test('GeoArrowTableAdapter#validates geometry column metadata', async t => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const geometryColumn = getGeoArrowGeometryColumn(table, 'geometry');

  t.equal(geometryColumn.geometryColumn, 'geometry', 'resolves explicit geometry column');
  t.equal(geometryColumn.encoding, 'geoarrow.point', 'resolves point encoding');
  t.throws(
    () => getApacheArrowTable({shape: 'not-arrow-table'} as any),
    /expected an Apache Arrow table/,
    'rejects non-Arrow input'
  );
  t.throws(
    () => getGeoArrowGeometryColumn(table, 'missing'),
    /could not find GeoArrow metadata/,
    'rejects missing geometry column metadata'
  );
  t.end();
});
