// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoArrowBuilder} from '@loaders.gl/gis';

test.each([
  ['xy', [1, 2], 2],
  ['xyz', [1, 2, 3], 3],
  ['xym', [1, 2, 4], 3],
  ['xyzm', [1, 2, 3, 4], 4]
] as const)('GeoArrowBuilder writes the %s coordinate contract', (dimension, expected, size) => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginPoint();
        builder.writeCoordinate(1, 2, 3, 4);
      }
    ],
    {encoding: 'geoarrow.point', dimension}
  );

  expect(geometryArray.coordinateSize).toBe(size);
  expect(Array.from(geometryArray.coordinates)).toEqual(expected);
});

test('GeoArrowBuilder preserves XYM through a coordinate transform', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginPoint();
        builder.writeCoordinate(1, 2, 9, 4);
      }
    ],
    {
      encoding: 'geoarrow.point',
      dimension: 'xym',
      transform: coordinate => [coordinate[0] + 10, coordinate[1] + 20, coordinate[2] + 30]
    }
  );

  expect(Array.from(geometryArray.coordinates)).toEqual([11, 22, 34]);
});

test('GeoArrowBuilder legacy hasZ and hasM flags resolve to an exact dimension', () => {
  const builder = new GeoArrowBuilder({
    encoding: 'geoarrow.point',
    mode: 'measure',
    hasZ: true,
    hasM: true
  });

  expect(builder.dimension).toBe('xyzm');
  expect(builder.hasZ).toBe(true);
  expect(builder.hasM).toBe(true);
});
