// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('convertBinaryGeometryToWKB#Point', t => {
  const geometry = makePoint([1, 2]);
  const wkb = convertBinaryGeometryToWKB(geometry);

  t.deepEqual(convertWKBToGeometry(toArrayBuffer(wkb!)), {type: 'Point', coordinates: [1, 2]});
  t.deepEqual(convert(geometry, 'wkb', [GeometryConverter]), wkb);
  t.equal(getBinaryGeometryWKBSize(geometry), wkb!.byteLength, 'measured byte length matches WKB');
  t.end();
});

test('convertBinaryGeometryToWKB#LineString', t => {
  const geometry = makeLineString([
    [1, 2],
    [3, 4]
  ]);
  const wkb = convertBinaryGeometryToWKB(geometry);

  t.deepEqual(convertWKBToGeometry(toArrayBuffer(wkb!)), {
    type: 'LineString',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  });
  t.end();
});

test('convertBinaryGeometryToWKB#Polygon', t => {
  const geometry = makePolygon([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0]
  ]);
  const wkb = convertBinaryGeometryToWKB(geometry);

  t.deepEqual(convertWKBToGeometry(toArrayBuffer(wkb!)), {
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
  t.end();
});

test('convertBinaryGeometryToWKB#reprojectWKBInPlace', t => {
  const wkb = convertBinaryGeometryToWKB(makePoint([1, 2, 9]), {hasZ: true})!;
  const reprojected = reprojectWKBInPlace(wkb, ([x, y]) => [x + 10, y + 20]);

  t.equal(reprojected, wkb);
  t.deepEqual(convertWKBToGeometry(toArrayBuffer(wkb)), {type: 'Point', coordinates: [11, 22, 9]});
  t.end();
});

test('convertBinaryGeometryToWKB#inferBinaryGeometryTypes', t => {
  t.deepEqual(
    inferBinaryGeometryTypes([
      makePoint([1, 2]),
      makeLineString([
        [1, 2, 3],
        [4, 5, 6]
      ]),
      null
    ]),
    ['Point', 'LineString Z']
  );
  t.end();
});

test('WKBBuilder#incremental geometry writers measure and write the same bytes', t => {
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
    t.equal(writeBuilder.finishGeometry(), byteLength, 'writer byte length matches measure pass');
    t.ok(convertWKBToGeometry(toArrayBuffer(values)), 'written WKB decodes');
  }

  t.end();
});

test('WKBBuilder#buildGeometryArray builds offsets, values and null bitmap', t => {
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

  t.deepEqual([...geometryArray.valueOffsets], [0, 21, 21, 42], 'offsets include null geometry');
  t.deepEqual(
    geometryArray.nullBitmap,
    new Uint8Array([0b00000101]),
    'null bitmap marks valid rows'
  );
  t.equal(geometryArray.nullCount, 1, 'null count is tracked');
  t.deepEqual(
    convertWKBToGeometry(
      geometryArray.values.buffer.slice(
        geometryArray.valueOffsets[2],
        geometryArray.valueOffsets[3]
      ) as ArrayBuffer
    ),
    {type: 'Point', coordinates: [3, 4]},
    'second non-null value decodes from contiguous values buffer'
  );
  t.end();
});

test('writeBinaryGeometryToWKB#adapter matches convenience conversion', t => {
  const geometry = makeLineString([
    [1, 2, 3],
    [4, 5, 6]
  ]);
  const expected = convertBinaryGeometryToWKB(geometry, {hasZ: true})!;
  const values = new Uint8Array(getBinaryGeometryWKBSize(geometry, {hasZ: true}));
  const builder = new WKBBuilder({mode: 'write', target: values, hasZ: true});

  writeBinaryGeometryToWKB(builder, geometry);
  t.equal(builder.finishGeometry(), values.byteLength, 'adapter wrote expected byte length');
  t.deepEqual(values, expected, 'adapter output matches convenience conversion');
  t.end();
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
