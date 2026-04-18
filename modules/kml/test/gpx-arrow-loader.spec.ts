// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {fetchFile, load} from '@loaders.gl/core';
import {getGeoMetadata} from '@loaders.gl/geoarrow';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {GPXArrowLoader} from '@loaders.gl/kml';
import type {ArrowTable} from '@loaders.gl/schema';

const GPX_URL = '@loaders.gl/kml/test/data/gpx/trek';

test('GPXArrowLoader#loader conformance', t => {
  validateLoader(t, GPXArrowLoader, 'GPXArrowLoader');
  t.end();
});

test('GPXArrowLoader#parse', async t => {
  const arrowTable = await load(`${GPX_URL}.gpx`, GPXArrowLoader);
  const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata || {});
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: getRowsFromArrowTable(arrowTable)},
    arrowTable.schema!
  );

  const response = await fetchFile(`${GPX_URL}.geojson`);
  const expected = await response.json();

  t.equal(arrowTable.shape, 'arrow-table', 'shape is arrow-table');
  t.equal(geoMetadata?.primary_column, 'geometry', 'geo metadata primary column is set');
  t.equal(geoMetadata?.columns.geometry.encoding, 'wkb', 'geo metadata uses WKB encoding');
  t.deepEqual(
    geoMetadata?.columns.geometry.geometry_types,
    ['LineString Z'],
    'geo metadata geometry type matches GPX fixture'
  );
  t.deepEqual(roundTripped.features, expected.features, 'Arrow output matches expected GeoJSON');
  t.end();
});

/**
 * Reads Arrow rows as plain objects so they can be passed to WKB conversion helpers.
 *
 * @param table - Arrow table emitted by a loader.
 * @returns Object rows preserving the binary geometry column.
 */
function getRowsFromArrowTable(table: ArrowTable): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    const row = table.data.get(rowIndex)?.toJSON() || {};
    rows.push(normalizeBinaryGeometryRow(row));
  }
  return rows;
}

/**
 * Ensures the geometry column is represented as a typed byte array for WKB conversion helpers.
 *
 * @param row - Serialized Arrow row.
 * @returns Row with a normalized `geometry` value.
 */
function normalizeBinaryGeometryRow(row: Record<string, unknown>): Record<string, unknown> {
  const geometry = row.geometry;
  if (Array.isArray(geometry) || isNumericKeyObject(geometry)) {
    return {...row, geometry: new Uint8Array(Object.values(geometry as Record<string, number>))};
  }
  return row;
}

/**
 * Returns true when a value is a plain object containing numeric keys for byte values.
 *
 * @param value - Candidate geometry value.
 * @returns Whether the value should be converted to `Uint8Array`.
 */
function isNumericKeyObject(value: unknown): value is Record<string, number> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !ArrayBuffer.isView(value) &&
    Object.keys(value).every(key => /^\d+$/.test(key))
  );
}
