// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {writeWKB} from '@math.gl/wkb';
import {convertWKBToBinaryGeometry} from '../../src/lib/geometry-converters/wkb/convert-wkb-to-binary-geometry';

test('math.gl traversal retains legacy XYM positions without confusing measures with Z', () => {
  const bytes = writeWKB(
    {
      type: 'MultiPoint',
      coordinates: [
        [1, 2, 3],
        [4, 5, 6]
      ]
    },
    'xym'
  );
  const geometry = convertWKBToBinaryGeometry(bytes.buffer);
  expect(geometry.type).toBe('Point');
  expect(geometry.positions).toEqual({value: new Float64Array([1, 2, 3, 4, 5, 6]), size: 3});
});

test('legacy empty line offsets distinguish a single empty line from empty multi parts', () => {
  const single = convertWKBToBinaryGeometry(writeWKB({type: 'LineString', coordinates: []}).buffer);
  const multi = convertWKBToBinaryGeometry(
    writeWKB({type: 'MultiLineString', coordinates: [[], [[1, 2]]]}).buffer
  );
  expect(single).toMatchObject({pathIndices: {value: new Uint32Array([0])}});
  expect(multi).toMatchObject({pathIndices: {value: new Uint32Array([0, 0, 1])}});
});

test('legacy polygon offsets remain vertex-based and retain empty polygon parts', () => {
  const bytes = writeWKB({
    type: 'MultiPolygon',
    coordinates: [
      [],
      [
        [
          [0, 0],
          [1, 0],
          [0, 0]
        ]
      ],
      []
    ]
  });
  const geometry = convertWKBToBinaryGeometry(bytes.buffer);
  expect(geometry).toMatchObject({
    type: 'Polygon',
    polygonIndices: {value: new Uint32Array([0, 0, 3, 3])},
    primitivePolygonIndices: {value: new Uint32Array([0, 3])}
  });
  expect(() =>
    convertWKBToBinaryGeometry(writeWKB({type: 'GeometryCollection', geometries: []}).buffer)
  ).toThrow('Unsupported geometry type: 7');
  expect(() => convertWKBToBinaryGeometry(bytes.slice(0, -1).buffer)).toThrow();
});
