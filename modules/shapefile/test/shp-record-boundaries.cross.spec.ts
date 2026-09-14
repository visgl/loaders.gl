// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {convertWKBToGeometry, GeoArrowBuilder} from '@loaders.gl/gis';
import {
  getRecordWKBOptions,
  parseRecord,
  parseRecordToWKB,
  writeRecordToGeoArrow
} from '../src/lib/parsers/parse-shp-geometry';

type Point = [number, number];

describe('SHP record geometry boundaries', () => {
  test('covers null, point, and dimensional WKB records', () => {
    expect(parseRecord(new DataView(new ArrayBuffer(4)))).toBeNull();

    const point = createPointRecord(1, 3, 4);
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(point)!))).toEqual({
      type: 'Point',
      coordinates: [3, 4]
    });
    expect(parseRecordToWKB(point)).toEqual(parseRecord(point));

    const pointZ = createPointRecord(11, 3, 4, 5, 6);
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(pointZ)!))).toEqual({
      type: 'Point',
      coordinates: [3, 4, 5, 6]
    });
    expect(getRecordWKBOptions(11, {shp: {_maxDimensions: 3}})).toEqual({
      hasZ: true,
      hasM: false
    });
    expect(getRecordWKBOptions(21, {shp: {_maxDimensions: 3}})).toEqual({hasM: true});
  });

  test('covers singleton and multi-part MultiPoint records', () => {
    const singleton = createMultiPointRecord(8, [[1, 2]]);
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(singleton)!))).toEqual({
      type: 'Point',
      coordinates: [1, 2]
    });

    const multiple = createMultiPointRecord(8, [
      [1, 2],
      [3, 4]
    ]);
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(multiple)!))).toEqual({
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    });
  });

  test('covers line and polygon record topology branches', () => {
    const line = createPolyRecord(
      3,
      [
        [0, 1],
        [2, 3]
      ],
      [2]
    );
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(line)!))).toEqual({
      type: 'LineString',
      coordinates: [
        [0, 1],
        [2, 3]
      ]
    });

    const multiLine = createPolyRecord(
      3,
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0]
      ],
      [2, 2]
    );
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(multiLine)!)).type).toBe(
      'MultiLineString'
    );

    const polygon = createPolyRecord(
      5,
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      [5]
    );
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(polygon)!)).type).toBe('Polygon');
  });

  test('writes point, line, and polygon records directly to GeoArrow', () => {
    const pointArray = GeoArrowBuilder.buildGeometryArray(
      [builder => writeRecordToGeoArrow(builder, createPointRecord(1, 3, 4))],
      {encoding: 'geoarrow.point', dimension: 'xy'}
    );
    expect(Array.from(pointArray.coordinates)).toEqual([3, 4]);

    const line = createPolyRecord(
      3,
      [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3]
      ],
      [2, 2]
    );
    expect(() =>
      GeoArrowBuilder.buildGeometryArray([builder => writeRecordToGeoArrow(builder, line)], {
        encoding: 'geoarrow.linestring',
        dimension: 'xy'
      })
    ).toThrow('multi-part SHP polyline');
    const multiLineArray = GeoArrowBuilder.buildGeometryArray(
      [builder => writeRecordToGeoArrow(builder, line)],
      {encoding: 'geoarrow.multilinestring', dimension: 'xy'}
    );
    expect(multiLineArray.geometryOffsets).toEqual(new Int32Array([0, 2]));

    const multiPolygon = createPolyRecord(
      5,
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
        [2, 0],
        [2, 1],
        [3, 1],
        [3, 0],
        [2, 0]
      ],
      [5, 5]
    );
    expect(convertWKBToGeometry(toArrayBuffer(parseRecord(multiPolygon)!)).type).toBe(
      'MultiPolygon'
    );
    expect(() =>
      GeoArrowBuilder.buildGeometryArray(
        [builder => writeRecordToGeoArrow(builder, multiPolygon)],
        {encoding: 'geoarrow.polygon', dimension: 'xy'}
      )
    ).toThrow('multi-polygon SHP polygon');
    const multiPolygonArray = GeoArrowBuilder.buildGeometryArray(
      [builder => writeRecordToGeoArrow(builder, multiPolygon)],
      {encoding: 'geoarrow.multipolygon', dimension: 'xy'}
    );
    expect(multiPolygonArray.geometryOffsets).toEqual(new Int32Array([0, 2]));

    const holeOnlyPolygon = createPolyRecord(
      5,
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ],
      [5]
    );
    const emptyExteriorArray = GeoArrowBuilder.buildGeometryArray(
      [builder => writeRecordToGeoArrow(builder, holeOnlyPolygon)],
      {encoding: 'geoarrow.multipolygon', dimension: 'xy'}
    );
    expect(emptyExteriorArray.geometryOffsets).toEqual(new Int32Array([0, 1]));
  });
});

function createPointRecord(type: number, x: number, y: number, z?: number, m?: number): DataView {
  const dimensions = z === undefined ? 2 : m === undefined ? 3 : 4;
  const bytes = new ArrayBuffer(4 + dimensions * 8);
  const view = new DataView(bytes);
  view.setInt32(0, type, true);
  view.setFloat64(4, x, true);
  view.setFloat64(12, y, true);
  if (z !== undefined) view.setFloat64(20, z, true);
  if (m !== undefined) view.setFloat64(28, m, true);
  return view;
}

function createMultiPointRecord(type: number, points: Point[]): DataView {
  const bytes = new ArrayBuffer(4 + 32 + 4 + points.length * 16);
  const view = new DataView(bytes);
  view.setInt32(0, type, true);
  view.setInt32(36, points.length, true);
  for (let index = 0; index < points.length; index++) {
    view.setFloat64(40 + index * 16, points[index][0], true);
    view.setFloat64(48 + index * 16, points[index][1], true);
  }
  return view;
}

function createPolyRecord(type: number, points: Point[], parts: number[]): DataView {
  const bytes = new ArrayBuffer(4 + 32 + 8 + parts.length * 4 + points.length * 16);
  const view = new DataView(bytes);
  view.setInt32(0, type, true);
  view.setInt32(36, parts.length, true);
  view.setInt32(40, points.length, true);
  let pointOffset = 0;
  for (let partIndex = 0; partIndex < parts.length; partIndex++) {
    view.setInt32(44 + partIndex * 4, pointOffset, true);
    pointOffset += parts[partIndex];
  }
  const pointOffsetInBytes = 44 + parts.length * 4;
  for (let index = 0; index < points.length; index++) {
    view.setFloat64(pointOffsetInBytes + index * 16, points[index][0], true);
    view.setFloat64(pointOffsetInBytes + index * 16 + 8, points[index][1], true);
  }
  return view;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
