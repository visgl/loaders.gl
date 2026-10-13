// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseWKB, WKBBuilder} from '@math.gl/wkb';
import type {Geometry} from '@loaders.gl/schema';
import {
  convertGeometryToWKB,
  convertGeometryToWKT,
  convertWKBToGeometry,
  convertWKTToGeometry,
  getWKTDimension
} from '../src/geometry-codecs';
import {reprojectWKBInPlace} from '../src/binary-geometry-to-wkb';

describe('loader codec compatibility over math.gl', () => {
  test.each([
    ['POINT EMPTY', 'POINT EMPTY'],
    ['POINT M (1 2 3)', 'POINT M (1 2 3)'],
    ['GEOMETRYCOLLECTION M (POINT (1 2 3))', 'GEOMETRYCOLLECTION (POINT M (1 2 3))'],
    [
      'GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))',
      'GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))'
    ]
  ])('preserves dimensions and empty points in %s', (input, expected) => {
    const geometry = convertWKTToGeometry(input);
    expect(geometry).not.toBeNull();
    expect(convertGeometryToWKT(geometry!)).toBe(expected);
  });

  test.each([
    'POINT ()',
    'GEOMETRYCOLLECTION ()',
    'POINT Z (1 2)',
    'POINT (1 2) trailing'
  ])('retains null-on-invalid behavior for %s', input =>
    expect(convertWKTToGeometry(input)).toBeNull());

  test('preserves optional EWKT CRS without exposing dimension markers as properties', () => {
    const geometry = convertWKTToGeometry('SRID=4326;POINT M (1 2 3)', {wkt: {crs: true}});
    expect(geometry).toMatchObject({
      crs: {type: 'name', properties: {name: 'urn:ogc:def:crs:EPSG::4326'}}
    });
    expect(Object.keys(geometry!)).not.toContain('__geoarrowDimension');
    expect(convertWKTToGeometry('SRID=4326;POINT (1 2)')).not.toHaveProperty('crs');
    expect(getWKTDimension('POINT ZM EMPTY')).toBe('xyzm');
    expect(getWKTDimension('not a geometry')).toBeNull();
  });

  test('preserves mixed collection child dimensions when writing WKB', () => {
    const geometry = convertWKTToGeometry('GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))')!;
    const bytes = new Uint8Array(convertGeometryToWKB(geometry));
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(1, true)).toBe(7);
    expect(view.getUint32(10, true)).toBe(1001);
    expect(view.getUint32(39, true)).toBe(2001);
    expect(parseWKB(bytes).geometry).toEqual(geometry);
  });

  test('decodes only the supplied WKB view and normalizes empty children', () => {
    const geometry: Geometry = {
      type: 'GeometryCollection',
      geometries: [
        {type: 'Point', coordinates: []},
        {type: 'MultiPoint', coordinates: [[], [1, 2]]}
      ]
    };
    const bytes = new Uint8Array(convertGeometryToWKB(geometry));
    const storage = new Uint8Array(bytes.length + 9).fill(255);
    storage.set(bytes, 4);
    expect(convertWKBToGeometry(new DataView(storage.buffer, 4, bytes.length))).toEqual(geometry);
    expect(() => convertWKBToGeometry(storage)).toThrow();
  });

  test('reprojects through math.gl traversal while preserving Z/M and EWKB SRID', () => {
    const storage = new Uint8Array(49);
    const builder = new WKBBuilder({
      mode: 'write',
      target: storage,
      byteOffset: 4,
      dimension: 'xyzm',
      srid: 4326
    });
    builder.beginPoint();
    builder.writeCoordinate(1, 2, 3, 4);
    const bytes = storage.subarray(4, 4 + builder.finishGeometry());
    expect(reprojectWKBInPlace(bytes, coordinate => [coordinate[0] + 10, coordinate[1] + 20])).toBe(
      bytes
    );
    expect(parseWKB(bytes)).toMatchObject({
      srid: 4326,
      dimension: 'xyzm',
      geometry: {type: 'Point', coordinates: [11, 22, 3, 4]}
    });
    expect(storage.slice(0, 4)).toEqual(new Uint8Array(4));
  });
});
