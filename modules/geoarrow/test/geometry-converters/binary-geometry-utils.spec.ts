// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryLineGeometry, BinaryPointGeometry} from '@loaders.gl/core/schema';
import {describe, expect, test} from 'vitest';
import {getBinaryGeometryInfo} from '@loaders.gl/geoarrow';
import {convertBinaryGeometryToGeometry} from '@loaders.gl/geoarrow';

describe('binary geometry utilities', () => {
  test('identifies single and multi binary geometries', () => {
    const point: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2]), size: 2}
    };
    const multiPoint: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2, 3, 4]), size: 2}
    };
    const line: BinaryLineGeometry = {
      type: 'LineString',
      positions: {value: new Float32Array([0, 0, 1, 1]), size: 2},
      pathIndices: {value: new Uint32Array([0, 2]), size: 1}
    };
    const multiLine = {...line, pathIndices: {value: new Uint32Array([0, 1, 2]), size: 1}};
    const polygon = {
      type: 'Polygon' as const,
      positions: {value: new Float32Array([0, 0, 1, 0, 0, 0]), size: 2},
      polygonIndices: {value: new Uint32Array([0, 1]), size: 1},
      primitivePolygonIndices: {value: new Uint32Array([0, 3]), size: 1}
    };
    const multiPolygon = {...polygon, polygonIndices: {value: new Uint32Array([0, 1, 2]), size: 1}};

    expect(getBinaryGeometryInfo(point).multiGeometryType).toBe('Point');
    expect(getBinaryGeometryInfo(multiPoint).multiGeometryType).toBe('MultiPoint');
    expect(getBinaryGeometryInfo(line).multiGeometryType).toBe('LineString');
    expect(getBinaryGeometryInfo(multiLine).multiGeometryType).toBe('MultiLineString');
    expect(getBinaryGeometryInfo(polygon).multiGeometryType).toBe('Polygon');
    expect(getBinaryGeometryInfo(multiPolygon).multiGeometryType).toBe('MultiPolygon');
  });

  test('converts single and multi binary geometries to GeoJSON', () => {
    const multiPoint: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2, 3, 4]), size: 2}
    };
    expect(convertBinaryGeometryToGeometry(multiPoint)).toEqual({
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    });
    expect(convertBinaryGeometryToGeometry(multiPoint, 1, 2)).toEqual({
      type: 'Point',
      coordinates: [3, 4]
    });
  });
});
