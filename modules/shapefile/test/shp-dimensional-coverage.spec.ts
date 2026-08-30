// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {convertWKBToGeometry} from '@loaders.gl/gis';
import {SHPLoader} from '@loaders.gl/shapefile';
import {describe, expect, test} from 'vitest';

const DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';

describe('SHP dimensional geometry coverage', () => {
  test.each([
    ['pointm', 'Point'],
    ['multipointm', 'MultiPoint'],
    ['polylinem', 'LineString'],
    ['polygonm', 'Polygon']
  ])('decodes compact M fixture %s through the WKB path', async (fixture, expectedType) => {
    const result = await load(`${DATA_FOLDER}/${fixture}.shp`, SHPLoader, {
      core: {worker: false},
      shp: {shape: 'wkb'}
    });
    const geometries = result.geometries
      .filter((geometry): geometry is Uint8Array => geometry !== null)
      .map(geometry => convertWKBToGeometry(toArrayBuffer(geometry)));
    expect(geometries.length).toBeGreaterThan(0);
    expect(geometries[0].type).toBe(expectedType);
  });

  test.each([
    'point-z',
    'multipointm',
    'polylinem',
    'polygonm'
  ])('writes compact dimensional fixture %s directly to typed GeoArrow', async fixture => {
    const table = await load(`${DATA_FOLDER}/${fixture}.shp`, SHPLoader, {
      core: {worker: false},
      shp: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow'}
    });
    expect(table.shape).toBe('arrow-table');
    expect(table.data.numRows).toBeGreaterThan(0);
    expect(
      table.data.schema.fields.some(field =>
        field.metadata?.get('ARROW:extension:name')?.startsWith('geoarrow.')
      )
    ).toBe(true);
  });

  test('rejects unsupported record types deterministically', async () => {
    const {parseRecordToWKB} = await import('../src/lib/parsers/parse-shp-geometry');
    const bytes = new ArrayBuffer(4);
    new DataView(bytes).setInt32(0, 99, true);
    expect(() => parseRecordToWKB(new DataView(bytes))).toThrow('unsupported shape type: 99');
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
