// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {triangulateWKB} from '../../../src/lib/geometry-converters/wkb/triangulate-wkb';

type Position = [number, number, ...number[]];

test('triangulates empty, simple, reversed, dimensional, and offset-view polygons', () => {
  expect(triangulateWKB(createPolygonWKB([], {littleEndian: true}))).toEqual([]);
  expect(
    triangulateWKB(
      createPolygonWKB(
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ],
        {littleEndian: true}
      )
    )
  ).toHaveLength(6);

  const bigEndianXYZM = createPolygonWKB(
    [
      [
        [0, 0, 10, 20],
        [1, 0, 11, 21],
        [1, 1, 12, 22],
        [0, 1, 13, 23],
        [0, 0, 10, 20]
      ]
    ],
    {littleEndian: false, dimensions: 4, isoDimensionCode: 3}
  );
  expect(triangulateWKB(bigEndianXYZM)).toHaveLength(6);

  const padded = new Uint8Array(bigEndianXYZM.byteLength + 8);
  padded.set(new Uint8Array(bigEndianXYZM), 4);
  expect(triangulateWKB(padded.subarray(4, 4 + bigEndianXYZM.byteLength))).toHaveLength(6);
});

test('triangulates polygons with ordinary, one-point, and coincident holes', () => {
  const outer: Position[] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0]
  ];
  const hole: Position[] = [
    [2, 2],
    [2, 4],
    [4, 4],
    [4, 2],
    [2, 2]
  ];
  expect(triangulateWKB(createPolygonWKB([outer, hole], {littleEndian: true}))).toHaveLength(24);
  expect(
    triangulateWKB(createPolygonWKB([outer, [[5, 5]]], {littleEndian: true})).length
  ).toBeGreaterThan(0);
  expect(
    triangulateWKB(createPolygonWKB([outer, hole, hole], {littleEndian: true})).length
  ).toBeGreaterThan(0);
  expect(
    triangulateWKB(createPolygonWKB([outer, hole], {littleEndian: false})).length
  ).toBeGreaterThan(0);
});

test('triangulates EWKB Z, M, ZM, and SRID polygon headers', () => {
  const rings: Position[][] = [
    [
      [0, 0, 1, 2],
      [2, 0, 3, 4],
      [0, 2, 5, 6],
      [0, 0, 1, 2]
    ]
  ];
  for (const geometryCode of [0x80000003, 0x40000003, 0xc0000003]) {
    expect(
      triangulateWKB(
        createPolygonWKB(rings, {
          littleEndian: true,
          dimensions: geometryCode === 0xc0000003 ? 4 : 3,
          geometryCode
        })
      )
    ).toHaveLength(3);
  }
  expect(
    triangulateWKB(
      createPolygonWKB(rings, {
        littleEndian: true,
        dimensions: 2,
        geometryCode: 0x20000003,
        srid: 4326
      })
    )
  ).toHaveLength(3);
});

test('triangulates large hashed rings and difficult degenerate outlines', () => {
  const circle: Position[] = Array.from({length: 96}, (_, index) => {
    const angle = (index / 96) * Math.PI * 2;
    return [Math.cos(angle) * 10, Math.sin(angle) * 10];
  });
  circle.push(circle[0]);
  expect(triangulateWKB(createPolygonWKB([circle], {littleEndian: true}))).toHaveLength(282);

  const duplicateAndCollinear: Position[] = [
    [0, 0],
    [2, 0],
    [2, 0],
    [4, 0],
    [4, 4],
    [2, 2],
    [0, 4],
    [0, 0]
  ];
  expect(
    triangulateWKB(createPolygonWKB([duplicateAndCollinear], {littleEndian: true})).length
  ).toBeGreaterThan(0);

  const selfIntersecting: Position[] = [
    [0, 0],
    [4, 4],
    [0, 4],
    [4, 0],
    [2, 5],
    [0, 0]
  ];
  expect(
    triangulateWKB(createPolygonWKB([selfIntersecting], {littleEndian: true})).length
  ).toBeGreaterThan(0);
});

test('triangulates multipolygons with global vertex offsets and rejects invalid children', () => {
  const first = createPolygonWKB(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0]
      ]
    ],
    {littleEndian: true}
  );
  const second = createPolygonWKB(
    [
      [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 2]
      ]
    ],
    {littleEndian: false}
  );
  const triangles = triangulateWKB(createMultiPolygonWKB([first, second], true));
  expect(triangles).toHaveLength(6);
  expect(Math.max(...triangles)).toBeGreaterThanOrEqual(4);

  const pointWKB = new ArrayBuffer(5);
  const pointView = new DataView(pointWKB);
  pointView.setUint8(0, 1);
  pointView.setUint32(1, 1, true);
  expect(() => triangulateWKB(createMultiPolygonWKB([pointWKB], true))).toThrow('must be Polygon');
  expect(() => triangulateWKB(pointWKB)).toThrow('Expected Polygon or MultiPolygon');
});

/** Encodes polygon rings as WKB for direct triangulation tests. */
function createPolygonWKB(
  rings: Position[][],
  options: {
    littleEndian: boolean;
    dimensions?: 2 | 3 | 4;
    isoDimensionCode?: 1 | 2 | 3;
    geometryCode?: number;
    srid?: number;
  }
): ArrayBuffer {
  const dimensions = options.dimensions || 2;
  const headerByteLength = options.srid === undefined ? 5 : 9;
  const byteLength =
    headerByteLength +
    4 +
    rings.reduce((length, ring) => length + 4 + ring.length * dimensions * 8, 0);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint8(0, options.littleEndian ? 1 : 0);
  dataView.setUint32(
    1,
    options.geometryCode ?? 3 + (options.isoDimensionCode || 0) * 1000,
    options.littleEndian
  );
  if (options.srid !== undefined) dataView.setUint32(5, options.srid, options.littleEndian);
  dataView.setUint32(headerByteLength, rings.length, options.littleEndian);
  let byteOffset = headerByteLength + 4;
  for (const ring of rings) {
    dataView.setUint32(byteOffset, ring.length, options.littleEndian);
    byteOffset += 4;
    for (const position of ring) {
      for (let dimension = 0; dimension < dimensions; dimension++) {
        dataView.setFloat64(byteOffset, position[dimension] || 0, options.littleEndian);
        byteOffset += 8;
      }
    }
  }
  return arrayBuffer;
}

/** Encodes complete polygon WKB values in a MultiPolygon envelope. */
function createMultiPolygonWKB(polygons: ArrayBuffer[], littleEndian: boolean): ArrayBuffer {
  const byteLength = 9 + polygons.reduce((length, polygon) => length + polygon.byteLength, 0);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint8(0, littleEndian ? 1 : 0);
  dataView.setUint32(1, 6, littleEndian);
  dataView.setUint32(5, polygons.length, littleEndian);
  let byteOffset = 9;
  for (const polygon of polygons) {
    new Uint8Array(arrayBuffer, byteOffset).set(new Uint8Array(polygon));
    byteOffset += polygon.byteLength;
  }
  return arrayBuffer;
}
