// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Builder} from 'flatbuffers';
import {expect, test, vi} from 'vitest';
import {convertWKBToGeometry, WKBBuilder} from '@loaders.gl/gis';
import {
  decodeFlatGeobufGeometry,
  FlatGeobufGeometryType,
  getFlatGeobufGeometryBounds,
  type FlatGeobufHeader,
  writeFlatGeobufGeometry,
  writeFlatGeobufGeometryToWKB
} from '../src/lib/flatgeobuf-reader';

type GeometryFixture = {
  arrayBuffer: ArrayBuffer;
  geometryOffset: number;
};

type GeometryDescription = {
  type: FlatGeobufGeometryType;
  xy?: number[];
  z?: number[];
  ends?: number[];
  parts?: GeometryDescription[];
};

const BASE_HEADER: FlatGeobufHeader = {
  geometryType: FlatGeobufGeometryType.Unknown,
  hasZ: false,
  columns: [],
  featuresCount: 0,
  indexNodeSize: 0,
  headerLength: 0,
  featureOffset: 0
};

/** Creates a FlatBuffers numeric vector in reverse builder order. */
function createNumericVector(
  builder: Builder,
  values: number[] | undefined,
  byteWidth: 4 | 8
): number {
  if (!values) return 0;
  builder.startVector(byteWidth, values.length, byteWidth);
  for (let index = values.length - 1; index >= 0; index--) {
    if (byteWidth === 8) builder.addFloat64(values[index]);
    else builder.addInt32(values[index]);
  }
  return builder.endVector();
}

/** Builds one FlatGeobuf Geometry table, including recursively nested parts. */
function createGeometryTable(builder: Builder, description: GeometryDescription): number {
  const partOffsets = (description.parts || []).map(part => createGeometryTable(builder, part));
  let parts = 0;
  if (partOffsets.length > 0) {
    builder.startVector(4, partOffsets.length, 4);
    for (let index = partOffsets.length - 1; index >= 0; index--) {
      builder.addOffset(partOffsets[index]);
    }
    parts = builder.endVector();
  }
  const xy = createNumericVector(builder, description.xy, 8);
  const z = createNumericVector(builder, description.z, 8);
  const ends = createNumericVector(builder, description.ends, 4);
  builder.startObject(8);
  if (ends) builder.addFieldOffset(0, ends, 0);
  if (xy) builder.addFieldOffset(1, xy, 0);
  if (z) builder.addFieldOffset(2, z, 0);
  builder.addFieldInt8(6, description.type, 0);
  if (parts) builder.addFieldOffset(7, parts, 0);
  return builder.endObject();
}

/** Creates a standalone FlatGeobuf Geometry table fixture. */
function createGeometryFixture(description: GeometryDescription): GeometryFixture {
  const builder = new Builder(256);
  const root = createGeometryTable(builder, description);
  builder.finish(root);
  const bytes = builder.asUint8Array().slice();
  const arrayBuffer = bytes.buffer as ArrayBuffer;
  return {
    arrayBuffer,
    geometryOffset: new DataView(arrayBuffer).getUint32(0, true)
  };
}

/** Creates a recording GeoArrow builder surface for direct writer assertions. */
function createRecordingBuilder(): any {
  return {
    writeNullGeometry: vi.fn(),
    beginPoint: vi.fn(),
    beginMultiPoint: vi.fn(),
    beginLineString: vi.fn(),
    beginMultiLineString: vi.fn(),
    beginPolygon: vi.fn(),
    beginLinearRing: vi.fn(),
    beginMultiPolygon: vi.fn(),
    writeCoordinate: vi.fn()
  };
}

/** Writes a fixture through the two-pass WKB builder and returns its bytes. */
function writeFixtureToWKB(
  fixture: GeometryFixture,
  header: FlatGeobufHeader,
  geometryTypeOverride?: FlatGeobufGeometryType
): Uint8Array {
  const measure = new WKBBuilder({mode: 'measure', hasZ: header.hasZ});
  writeFlatGeobufGeometryToWKB(
    measure,
    fixture.arrayBuffer,
    fixture.geometryOffset,
    header,
    geometryTypeOverride
  );
  const byteLength = measure.finishGeometry();
  const bytes = new Uint8Array(byteLength);
  const writer = new WKBBuilder({mode: 'write', target: bytes, hasZ: header.hasZ});
  writeFlatGeobufGeometryToWKB(
    writer,
    fixture.arrayBuffer,
    fixture.geometryOffset,
    header,
    geometryTypeOverride
  );
  writer.finishGeometry();
  return bytes;
}

test.each([
  [FlatGeobufGeometryType.Point, [1, 2], undefined, {type: 'Point', coordinates: [1, 2]}],
  [
    FlatGeobufGeometryType.MultiPoint,
    [1, 2, 3, 4],
    undefined,
    {
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    }
  ],
  [
    FlatGeobufGeometryType.LineString,
    [0, 0, 2, 3],
    undefined,
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [2, 3]
      ]
    }
  ],
  [
    FlatGeobufGeometryType.MultiLineString,
    [0, 0, 1, 1, 2, 2],
    [2, 3],
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 1]
        ],
        [[2, 2]]
      ]
    }
  ],
  [
    FlatGeobufGeometryType.Polygon,
    [0, 0, 1, 0, 0, 0],
    [3],
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [0, 0]
        ]
      ]
    }
  ]
] as const)('FlatGeobuf direct geometry writers cover type %s', (type, xy, ends, expectedGeometry) => {
  const fixture = createGeometryFixture({type, xy: [...xy], ends: ends ? [...ends] : undefined});
  const builder = createRecordingBuilder();
  writeFlatGeobufGeometry(builder, fixture.arrayBuffer, fixture.geometryOffset, BASE_HEADER);
  expect(builder.writeCoordinate).toHaveBeenCalledTimes(xy.length / 2);
  expect(
    decodeFlatGeobufGeometry(fixture.arrayBuffer, fixture.geometryOffset, BASE_HEADER)
  ).toEqual(expectedGeometry);
  expect(
    getFlatGeobufGeometryBounds(fixture.arrayBuffer, fixture.geometryOffset, BASE_HEADER)
  ).toEqual([
    Math.min(...xy.filter((_, index) => index % 2 === 0)),
    Math.min(...xy.filter((_, index) => index % 2 === 1)),
    Math.max(...xy.filter((_, index) => index % 2 === 0)),
    Math.max(...xy.filter((_, index) => index % 2 === 1))
  ]);
  expect(convertWKBToGeometry(writeFixtureToWKB(fixture, BASE_HEADER).buffer)).toEqual(
    expectedGeometry
  );
});

test('FlatGeobuf geometry writers preserve Z coordinates and default missing part ends', () => {
  const fixture = createGeometryFixture({
    type: FlatGeobufGeometryType.LineString,
    xy: [1, 2, 3, 4],
    z: [5, 6]
  });
  const header = {...BASE_HEADER, hasZ: true};
  const builder = createRecordingBuilder();
  writeFlatGeobufGeometry(builder, fixture.arrayBuffer, fixture.geometryOffset, header);
  expect(builder.writeCoordinate.mock.calls).toEqual([
    [1, 2, 5],
    [3, 4, 6]
  ]);
  expect(decodeFlatGeobufGeometry(fixture.arrayBuffer, fixture.geometryOffset, header)).toEqual({
    type: 'LineString',
    coordinates: [
      [1, 2, 5],
      [3, 4, 6]
    ]
  });
});

test('FlatGeobuf nested multipolygon and collection writers recurse through part tables', () => {
  const polygon = {
    type: FlatGeobufGeometryType.Polygon,
    xy: [0, 0, 2, 0, 0, 0],
    ends: [3]
  };
  const multiPolygon = createGeometryFixture({
    type: FlatGeobufGeometryType.MultiPolygon,
    parts: [polygon, {...polygon, xy: [3, 3, 4, 3, 3, 3]}]
  });
  const builder = createRecordingBuilder();
  writeFlatGeobufGeometry(
    builder,
    multiPolygon.arrayBuffer,
    multiPolygon.geometryOffset,
    BASE_HEADER
  );
  expect(builder.beginMultiPolygon).toHaveBeenCalledWith(2);
  expect(builder.beginPolygon).toHaveBeenCalledTimes(2);
  expect(
    getFlatGeobufGeometryBounds(multiPolygon.arrayBuffer, multiPolygon.geometryOffset, BASE_HEADER)
  ).toEqual([0, 0, 4, 3]);
  expect(convertWKBToGeometry(writeFixtureToWKB(multiPolygon, BASE_HEADER).buffer)?.type).toBe(
    'MultiPolygon'
  );

  const collection = createGeometryFixture({
    type: FlatGeobufGeometryType.GeometryCollection,
    parts: [
      {type: FlatGeobufGeometryType.Point, xy: [8, 9]},
      {type: FlatGeobufGeometryType.LineString, xy: [-1, -2, 3, 4]}
    ]
  });
  expect(convertWKBToGeometry(writeFixtureToWKB(collection, BASE_HEADER).buffer)).toEqual({
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [8, 9]},
      {
        type: 'LineString',
        coordinates: [
          [-1, -2],
          [3, 4]
        ]
      }
    ]
  });
  expect(
    getFlatGeobufGeometryBounds(collection.arrayBuffer, collection.geometryOffset, BASE_HEADER)
  ).toEqual([-1, -2, 8, 9]);
});

test('FlatGeobuf geometry boundary errors are explicit and absent geometries stay absent', () => {
  const empty = createGeometryFixture({type: FlatGeobufGeometryType.Point});
  expect(getFlatGeobufGeometryBounds(empty.arrayBuffer, undefined, BASE_HEADER)).toBeUndefined();
  expect(
    getFlatGeobufGeometryBounds(empty.arrayBuffer, empty.geometryOffset, BASE_HEADER)
  ).toBeUndefined();
  expect(() =>
    writeFlatGeobufGeometryToWKB(
      new WKBBuilder({mode: 'measure'}),
      empty.arrayBuffer,
      undefined,
      BASE_HEADER
    )
  ).toThrow('Cannot write an absent');

  const builder = createRecordingBuilder();
  writeFlatGeobufGeometry(builder, empty.arrayBuffer, undefined, BASE_HEADER);
  expect(builder.writeNullGeometry).toHaveBeenCalledOnce();

  const unsupported = createGeometryFixture({type: FlatGeobufGeometryType.GeometryCollection});
  expect(() =>
    writeFlatGeobufGeometry(
      builder,
      unsupported.arrayBuffer,
      unsupported.geometryOffset,
      BASE_HEADER
    )
  ).toThrow('Unsupported FlatGeobuf geometry type');
  expect(() =>
    decodeFlatGeobufGeometry(unsupported.arrayBuffer, unsupported.geometryOffset, BASE_HEADER)
  ).toThrow('Unsupported FlatGeobuf geometry type');

  const noParts = createGeometryFixture({type: FlatGeobufGeometryType.MultiPolygon});
  expect(() =>
    writeFlatGeobufGeometry(builder, noParts.arrayBuffer, noParts.geometryOffset, BASE_HEADER)
  ).toThrow('has no polygon parts');
  expect(() =>
    writeFlatGeobufGeometryToWKB(
      new WKBBuilder({mode: 'measure'}),
      noParts.arrayBuffer,
      noParts.geometryOffset,
      BASE_HEADER
    )
  ).toThrow('has no polygon parts');

  expect(
    decodeFlatGeobufGeometry(noParts.arrayBuffer, noParts.geometryOffset, BASE_HEADER)
  ).toEqual({type: 'MultiPolygon', coordinates: [[[]]]});
});
