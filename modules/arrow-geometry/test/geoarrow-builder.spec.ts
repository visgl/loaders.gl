// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoArrowBuilder} from '@loaders.gl/arrow-geometry';

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

test('GeoArrowBuilder discovers LargeList for 64-bit offsets', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginLineString(2);
        builder.writeCoordinate(1, 2);
        builder.writeCoordinate(3, 4);
      }
    ],
    {encoding: 'geoarrow.linestring', offsetType: 'int64'}
  );

  const data = GeoArrowBuilder.makeGeometryData(geometryArray);
  expect(data.type.constructor.name).toBe('LargeList');
});

test.each([
  'xy',
  'xyz',
  'xym',
  'xyzm'
] as const)('GeoArrowBuilder writes %s boxes in both coordinate layouts', dimension => {
  for (const coordinateLayout of ['interleaved', 'separated'] as const) {
    const geometryArray = GeoArrowBuilder.buildGeometryArray(
      [
        builder => {
          builder.beginBox();
          builder.writeBox(1, 2, 5, 6, 3, 7, 4, 8);
        }
      ],
      {encoding: 'geoarrow.box', dimension, coordinateLayout}
    );

    const data = GeoArrowBuilder.makeGeometryData(geometryArray);
    expect(data.type.constructor.name).toBe('Struct');
    expect(data.children).toHaveLength(dimension === 'xy' ? 4 : dimension === 'xyzm' ? 8 : 6);
    if (coordinateLayout === 'interleaved') {
      expect(Array.from(geometryArray.coordinates as Float64Array)).toEqual(
        dimension === 'xy'
          ? [1, 2, 5, 6]
          : dimension === 'xyz'
            ? [1, 2, 3, 5, 6, 7]
            : dimension === 'xym'
              ? [1, 2, 4, 5, 6, 8]
              : [1, 2, 3, 4, 5, 6, 7, 8]
      );
    }
  }
});

test('GeoArrowBuilder supports separated coordinates, transform fallback, and null rows', () => {
  const writers = [
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2, 3, 4);
    },
    null
  ];
  const geometryArray = GeoArrowBuilder.buildGeometryArray(writers, {
    encoding: 'geoarrow.point',
    dimension: 'xyzm',
    coordinateLayout: 'separated',
    transform: coordinate => [coordinate[0] + 10]
  });

  expect(geometryArray.nullCount).toBe(1);
  expect(geometryArray.length).toBe(2);
  expect(geometryArray.coordinates).toMatchObject({
    x: new Float64Array([11, 0]),
    y: new Float64Array([2, 0]),
    z: new Float64Array([3, 0]),
    m: new Float64Array([4, 0])
  });
  expect(GeoArrowBuilder.makeGeometryData(geometryArray).nullCount).toBe(1);
});

test('GeoArrowBuilder rejects undersized coordinate and box targets', () => {
  const pointWriter = [
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    }
  ];
  const measuredPoint = GeoArrowBuilder.measureGeometryArray(pointWriter, {
    encoding: 'geoarrow.point'
  });
  measuredPoint.coordinates = new Float64Array(0);
  expect(() =>
    GeoArrowBuilder.writeGeometryArray(pointWriter, measuredPoint, {encoding: 'geoarrow.point'})
  ).toThrow('target coordinate buffer overflow');

  const boxWriter = [
    builder => {
      builder.beginBox();
      builder.writeBox(1, 2, 3, 4);
    }
  ];
  const measuredBox = GeoArrowBuilder.measureGeometryArray(boxWriter, {encoding: 'geoarrow.box'});
  measuredBox.coordinates = new Float64Array(0);
  expect(() =>
    GeoArrowBuilder.writeGeometryArray(boxWriter, measuredBox, {encoding: 'geoarrow.box'})
  ).toThrow('target box buffer overflow');
});

test('GeoArrowBuilder rejects a missing separated box coordinate buffer', () => {
  const writers = [
    builder => {
      builder.beginBox();
      builder.writeBox(1, 2, 3, 4);
    }
  ];
  const measured = GeoArrowBuilder.measureGeometryArray(writers, {
    encoding: 'geoarrow.box',
    coordinateLayout: 'separated'
  });
  (measured.coordinates as {xmin?: Float64Array}).xmin = undefined;

  expect(() =>
    GeoArrowBuilder.writeGeometryArray(writers, measured, {
      encoding: 'geoarrow.box',
      coordinateLayout: 'separated'
    })
  ).toThrow('target box buffer overflow');
});

test('GeoArrowBuilder rejects missing or undersized separated coordinate buffers', () => {
  const writers = [
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    }
  ];
  const missingCoordinate = GeoArrowBuilder.measureGeometryArray(writers, {
    encoding: 'geoarrow.point',
    coordinateLayout: 'separated'
  });
  (missingCoordinate.coordinates as {x?: Float64Array}).x = undefined;
  expect(() =>
    GeoArrowBuilder.writeGeometryArray(writers, missingCoordinate, {
      encoding: 'geoarrow.point',
      coordinateLayout: 'separated'
    })
  ).toThrow('target coordinate buffer overflow');

  const undersizedCoordinate = GeoArrowBuilder.measureGeometryArray(writers, {
    encoding: 'geoarrow.point',
    coordinateLayout: 'separated'
  });
  (undersizedCoordinate.coordinates as {y: Float64Array}).y = new Float64Array(0);
  expect(() =>
    GeoArrowBuilder.writeGeometryArray(writers, undersizedCoordinate, {
      encoding: 'geoarrow.point',
      coordinateLayout: 'separated'
    })
  ).toThrow('target coordinate buffer overflow');
});

test('GeoArrowBuilder rejects geometry events that do not match the encoding', () => {
  const invalidEvents: Array<[string, (builder: GeoArrowBuilder) => void]> = [
    ['Box', builder => builder.beginBox()],
    ['Box', builder => builder.writeBox(1, 2, 3, 4)],
    ['LineString', builder => builder.beginLineString(1)],
    ['Polygon', builder => builder.beginPolygon(1)],
    ['LinearRing', builder => builder.beginLinearRing(1)],
    ['MultiPoint', builder => builder.beginMultiPoint(1)],
    ['MultiLineString', builder => builder.beginMultiLineString(1)],
    ['MultiPolygon', builder => builder.beginMultiPolygon(1)]
  ];

  for (const [geometryName, writeEvent] of invalidEvents) {
    const builder = new GeoArrowBuilder({encoding: 'geoarrow.point', mode: 'measure'});
    expect(() => writeEvent(builder)).toThrow(`Cannot write ${geometryName} into geoarrow.point`);
  }
});
