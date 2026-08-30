// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WKBBuilder} from '@loaders.gl/gis';

test('WKBBuilder generic entrypoint writes every geometry header', () => {
  const geometryCases = [
    ['Point', 1],
    ['LineString', 2],
    ['Polygon', 3],
    ['MultiPoint', 4],
    ['MultiLineString', 5],
    ['MultiPolygon', 6],
    ['GeometryCollection', 7]
  ] as const;

  for (const [type, typeCode] of geometryCases) {
    const builder = new WKBBuilder({mode: 'measure'});
    builder.beginGeometry(type, 0);
    if (type === 'Point') builder.writeCoordinate(1, 2);
    const values = new Uint8Array(builder.finishGeometry());
    const writer = new WKBBuilder({mode: 'write', target: values});
    writer.beginGeometry(type, 0);
    if (type === 'Point') writer.writeCoordinate(1, 2);
    expect(new DataView(values.buffer).getUint32(1, true)).toBe(typeCode);
  }

  const numeric = new Uint8Array(21);
  const numericBuilder = new WKBBuilder({mode: 'write', target: numeric});
  numericBuilder.beginGeometry(1);
  numericBuilder.writeCoordinate(3, 4);
  expect(numericBuilder.getByteLength()).toBe(21);
  expect(() => new WKBBuilder({mode: 'measure'}).beginGeometry(999)).toThrow(
    'Unsupported WKB geometry type'
  );
});

test('WKBBuilder handles dimensions, transforms, target views, and overflow', () => {
  const dimensionCases = [
    [{hasZ: true}, 1001, 3],
    [{hasM: true}, 2001, 3],
    [{hasZ: true, hasM: true}, 3001, 4]
  ] as const;
  for (const [options, typeCode, coordinateCount] of dimensionCases) {
    const values = new Uint8Array(5 + coordinateCount * 8);
    const builder = new WKBBuilder({mode: 'write', target: values, ...options});
    builder.beginPoint();
    builder.writeCoordinate(1, 2);
    expect(new DataView(values.buffer).getUint32(1, true)).toBe(typeCode);
    expect(Number.isNaN(new DataView(values.buffer).getFloat64(values.byteLength - 8, true))).toBe(
      true
    );
  }

  const backing = new Uint8Array(64).fill(255);
  const target = backing.subarray(8, 40);
  const transformed = new WKBBuilder({
    mode: 'write',
    target,
    byteOffset: 4,
    transform: ([x, y]) => [x + 10, y + 20]
  });
  transformed.beginPoint();
  transformed.writeCoordinate(1, 2);
  expect(transformed.getByteLength()).toBe(21);
  const view = new DataView(backing.buffer);
  expect(view.getFloat64(17, true)).toBe(11);
  expect(view.getFloat64(25, true)).toBe(22);

  const dataViewTarget = new DataView(new ArrayBuffer(40), 5, 30);
  const dataViewBuilder = new WKBBuilder({mode: 'write', target: dataViewTarget, byteOffset: 2});
  dataViewBuilder.beginPoint();
  dataViewBuilder.writeCoordinate(7, 8);
  expect(new DataView(dataViewTarget.buffer).getUint32(8, true)).toBe(1);

  const arrayBuffer = new ArrayBuffer(21);
  const arrayBufferBuilder = new WKBBuilder({mode: 'write', target: arrayBuffer});
  arrayBufferBuilder.beginPoint();
  arrayBufferBuilder.writeCoordinate(1, 2);
  expect(arrayBufferBuilder.finishGeometry()).toBe(21);

  expect(() => new WKBBuilder({mode: 'write', target: new Uint8Array(4)}).beginPoint()).toThrow(
    'WKBBuilder overflow'
  );
});

test('WKBBuilder geometry arrays cover byte boundaries and all-valid output', () => {
  const pointWriter = (builder: WKBBuilder) => {
    builder.beginPoint();
    builder.writeCoordinate(1, 2);
  };
  const allValid = WKBBuilder.buildGeometryArray([pointWriter]);
  expect(allValid.nullBitmap).toBeUndefined();
  expect(allValid.nullCount).toBe(0);

  const writers = Array.from({length: 10}, (_, index) => (index === 8 ? null : pointWriter));
  const mixed = WKBBuilder.buildGeometryArray(writers);
  expect(mixed.nullBitmap).toEqual(new Uint8Array([0xff, 0x02]));
  expect(mixed.nullCount).toBe(1);
  expect(mixed.valueOffsets[9]).toBe(mixed.valueOffsets[8]);
});
