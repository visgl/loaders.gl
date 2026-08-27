// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {BinaryGeometry} from '@loaders.gl/schema';
import {convert} from '@loaders.gl/schema-utils';
import {
  GeometryConverter,
  WKBBuilder,
  convertBinaryGeometryToWKB,
  convertWKBToGeometry,
  getBinaryGeometryWKBSize,
  inferBinaryGeometryTypes,
  reprojectWKBInPlace,
  writeBinaryGeometryToWKB
} from '@loaders.gl/gis';
test('convertBinaryGeometryToWKB#Point', () => {
  const geometry = makePoint([1, 2]);
  const wkb = convertBinaryGeometryToWKB(geometry);
  expect(convertWKBToGeometry(toArrayBuffer(wkb!))).toEqual({type: 'Point', coordinates: [1, 2]});
  expect(convert(geometry, 'wkb', [GeometryConverter])).toEqual(wkb);
  expect(getBinaryGeometryWKBSize(geometry), 'measured byte length matches WKB').toBe(
    wkb!.byteLength
  );
});
test('convertBinaryGeometryToWKB#LineString', () => {
  const geometry = makeLineString([
    [1, 2],
    [3, 4]
  ]);
  const wkb = convertBinaryGeometryToWKB(geometry);
  expect(convertWKBToGeometry(toArrayBuffer(wkb!))).toEqual({
    type: 'LineString',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  });
});
test('convertBinaryGeometryToWKB#Polygon', () => {
  const geometry = makePolygon([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0]
  ]);
  const wkb = convertBinaryGeometryToWKB(geometry);
  expect(convertWKBToGeometry(toArrayBuffer(wkb!))).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]
    ]
  });
});
test('convertBinaryGeometryToWKB#reprojectWKBInPlace', () => {
  const wkb = convertBinaryGeometryToWKB(makePoint([1, 2, 9]), {hasZ: true})!;
  const reprojected = reprojectWKBInPlace(wkb, ([x, y]) => [x + 10, y + 20]);
  expect(reprojected).toBe(wkb);
  expect(convertWKBToGeometry(toArrayBuffer(wkb))).toEqual({
    type: 'Point',
    coordinates: [11, 22, 9]
  });
});
test('convertBinaryGeometryToWKB#inferBinaryGeometryTypes', () => {
  expect(
    inferBinaryGeometryTypes([
      makePoint([1, 2]),
      makeLineString([
        [1, 2, 3],
        [4, 5, 6]
      ]),
      null
    ])
  ).toEqual(['Point', 'LineString Z']);
});
test('WKBBuilder#incremental geometry writers measure and write the same bytes', () => {
  const geometryWriters = [
    (builder: WKBBuilder) => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    },
    (builder: WKBBuilder) => {
      builder.beginLineString(2);
      builder.writeCoordinate(1, 2);
      builder.writeCoordinate(3, 4);
    },
    (builder: WKBBuilder) => {
      builder.beginPolygon(1);
      builder.beginLinearRing(5);
      builder.writeCoordinate(0, 0);
      builder.writeCoordinate(1, 0);
      builder.writeCoordinate(1, 1);
      builder.writeCoordinate(0, 1);
      builder.writeCoordinate(0, 0);
    },
    (builder: WKBBuilder) => {
      builder.beginMultiPoint(2);
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
      builder.beginPoint();
      builder.writeCoordinate(3, 4);
    },
    (builder: WKBBuilder) => {
      builder.beginMultiLineString(1);
      builder.beginLineString(2);
      builder.writeCoordinate(1, 2);
      builder.writeCoordinate(3, 4);
    },
    (builder: WKBBuilder) => {
      builder.beginMultiPolygon(1);
      builder.beginPolygon(1);
      builder.beginLinearRing(5);
      builder.writeCoordinate(0, 0);
      builder.writeCoordinate(1, 0);
      builder.writeCoordinate(1, 1);
      builder.writeCoordinate(0, 1);
      builder.writeCoordinate(0, 0);
    }
  ];
  for (const geometryWriter of geometryWriters) {
    const measureBuilder = new WKBBuilder({mode: 'measure'});
    geometryWriter(measureBuilder);
    const byteLength = measureBuilder.finishGeometry();
    const values = new Uint8Array(byteLength);
    const writeBuilder = new WKBBuilder({mode: 'write', target: values});
    geometryWriter(writeBuilder);
    expect(writeBuilder.finishGeometry(), 'writer byte length matches measure pass').toBe(
      byteLength
    );
    expect(convertWKBToGeometry(toArrayBuffer(values)), 'written WKB decodes').toBeTruthy();
  }
});
test('WKBBuilder#buildGeometryArray builds offsets, values and null bitmap', () => {
  const geometryWriters = [
    (builder: WKBBuilder) => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    },
    null,
    (builder: WKBBuilder) => {
      builder.beginPoint();
      builder.writeCoordinate(3, 4);
    }
  ];
  const geometryArray = WKBBuilder.buildGeometryArray(geometryWriters);
  expect([...geometryArray.valueOffsets], 'offsets include null geometry').toEqual([0, 21, 21, 42]);
  expect(geometryArray.nullBitmap, 'null bitmap marks valid rows').toEqual(
    new Uint8Array([0b00000101])
  );
  expect(geometryArray.nullCount, 'null count is tracked').toBe(1);
  expect(
    convertWKBToGeometry(
      geometryArray.values.buffer.slice(
        geometryArray.valueOffsets[2],
        geometryArray.valueOffsets[3]
      ) as ArrayBuffer
    ),
    'second non-null value decodes from contiguous values buffer'
  ).toEqual({type: 'Point', coordinates: [3, 4]});
});
test('writeBinaryGeometryToWKB#adapter matches convenience conversion', () => {
  const geometry = makeLineString([
    [1, 2, 3],
    [4, 5, 6]
  ]);
  const expected = convertBinaryGeometryToWKB(geometry, {hasZ: true})!;
  const values = new Uint8Array(getBinaryGeometryWKBSize(geometry, {hasZ: true}));
  const builder = new WKBBuilder({mode: 'write', target: values, hasZ: true});
  writeBinaryGeometryToWKB(builder, geometry);
  expect(builder.finishGeometry(), 'adapter wrote expected byte length').toBe(values.byteLength);
  expect(values, 'adapter output matches convenience conversion').toEqual(expected);
});
function makePoint(coordinates: number[]): BinaryGeometry {
  return {
    type: 'Point',
    positions: {value: new Float64Array(coordinates), size: coordinates.length}
  } as BinaryGeometry;
}
function toArrayBuffer(wkb: Uint8Array): ArrayBuffer {
  return wkb.buffer.slice(wkb.byteOffset, wkb.byteOffset + wkb.byteLength) as ArrayBuffer;
}
function makeLineString(coordinates: number[][]): BinaryGeometry {
  return {
    type: 'LineString',
    positions: {
      value: new Float64Array(coordinates.flat()),
      size: coordinates[0].length
    },
    pathIndices: {value: new Uint32Array([0, coordinates.length]), size: 1}
  } as BinaryGeometry;
}
function makePolygon(coordinates: number[][]): BinaryGeometry {
  return {
    type: 'Polygon',
    positions: {
      value: new Float64Array(coordinates.flat()),
      size: coordinates[0].length
    },
    polygonIndices: {value: new Uint32Array([0, coordinates.length]), size: 1},
    primitivePolygonIndices: {value: new Uint32Array([0, coordinates.length]), size: 1}
  } as BinaryGeometry;
}
