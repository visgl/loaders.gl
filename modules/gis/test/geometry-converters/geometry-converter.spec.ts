// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryGeometry, Geometry} from '@loaders.gl/schema';
import {
  GeometryConverter,
  convertGeometryToTWKB,
  convertGeometryToWKB,
  convertGeometryToWKT
} from '@loaders.gl/gis';
import {describe, expect, test} from 'vitest';

const POINT: Geometry = {type: 'Point', coordinates: [1, 2]};
const BINARY_POINT: BinaryGeometry = {
  type: 'Point',
  positions: {value: new Float64Array([1, 2]), size: 2}
};

describe('GeometryConverter', () => {
  test('reports the complete conversion graph', () => {
    const supportedPairs = new Set([
      'geojson-geometry:wkb',
      'geojson-geometry:wkt',
      'geojson-geometry:twkb',
      'binary-geometry:geojson-geometry',
      'binary-geometry:wkb',
      'wkb:geojson-geometry',
      'wkt:geojson-geometry',
      'twkb:geojson-geometry'
    ]);

    for (const sourceShape of GeometryConverter.from) {
      for (const targetShape of GeometryConverter.to) {
        expect(GeometryConverter.canConvert(sourceShape, targetShape)).toBe(
          supportedPairs.has(`${sourceShape}:${targetShape}`)
        );
      }
    }
  });

  test('detects WKT, WKB, TWKB, GeoJSON, binary geometries and invalid inputs', () => {
    const wkb = convertGeometryToWKB(POINT);
    const storage = new Uint8Array(wkb.byteLength + 4);
    storage.set(wkb, 2);
    const offsetWKB = storage.subarray(2, 2 + wkb.byteLength);

    expect(GeometryConverter.detectInputShape('POINT (1 2)')).toBe('wkt');
    expect(GeometryConverter.detectInputShape(new Uint8Array(wkb).buffer)).toBe('wkb');
    expect(GeometryConverter.detectInputShape(offsetWKB)).toBe('wkb');
    expect(GeometryConverter.detectInputShape(convertGeometryToTWKB(POINT))).toBe('twkb');
    expect(GeometryConverter.detectInputShape(POINT)).toBe('geojson-geometry');
    expect(GeometryConverter.detectInputShape(BINARY_POINT)).toBe('binary-geometry');
    expect(GeometryConverter.detectInputShape({type: 'Feature', geometry: POINT})).toBeNull();
    expect(GeometryConverter.detectInputShape(null)).toBeNull();
  });

  test('converts every supported input and output shape', () => {
    const wkt = convertGeometryToWKT(POINT);
    const wkb = convertGeometryToWKB(POINT);
    const twkb = convertGeometryToTWKB(POINT);

    expect(GeometryConverter.convert(wkt, 'geojson-geometry')).toEqual(POINT);
    expect(GeometryConverter.convert(wkb, 'geojson-geometry')).toEqual(POINT);
    expect(GeometryConverter.convert(twkb, 'geojson-geometry')).toEqual(POINT);
    expect(GeometryConverter.convert(BINARY_POINT, 'geojson-geometry')).toEqual(POINT);
    expect(
      new Uint8Array(GeometryConverter.convert(BINARY_POINT, 'wkb') as ArrayBufferLike)
    ).toEqual(new Uint8Array(wkb));
    expect(new Uint8Array(GeometryConverter.convert(POINT, 'wkb') as ArrayBufferLike)).toEqual(
      new Uint8Array(wkb)
    );
    expect(GeometryConverter.convert(POINT, 'wkt')).toBe(wkt);
    expect(GeometryConverter.convert(POINT, 'twkb')).toEqual(twkb);
  });

  test('rejects unsupported targets and input values', () => {
    const wkb = convertGeometryToWKB(POINT);
    const cases: Array<[unknown, 'wkb' | 'wkt' | 'twkb']> = [
      ['POINT (1 2)', 'wkb'],
      [wkb, 'wkt'],
      [BINARY_POINT, 'wkt'],
      [POINT, 'geojson-geometry' as 'wkt']
    ];

    for (const [input, targetShape] of cases) {
      expect(() => GeometryConverter.convert(input, targetShape)).toThrow(
        /Unsupported geometry conversion target/
      );
    }
    expect(() => GeometryConverter.convert(42, 'wkb')).toThrow(
      /Unsupported geometry conversion input/
    );
  });
});
