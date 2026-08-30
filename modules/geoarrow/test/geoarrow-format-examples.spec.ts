// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  GeoArrowBuilder,
  type GeoArrowBuilderDimension,
  type GeoArrowBuilderEncoding,
  type GeoArrowGeometryWriter
} from '@loaders.gl/geoarrow';

const ENCODINGS: GeoArrowBuilderEncoding[] = [
  'geoarrow.point',
  'geoarrow.multipoint',
  'geoarrow.linestring',
  'geoarrow.multilinestring',
  'geoarrow.polygon',
  'geoarrow.multipolygon',
  'geoarrow.box'
];

const DIMENSIONS: GeoArrowBuilderDimension[] = ['xy', 'xyz', 'xym', 'xyzm'];
const COORDINATE_LAYOUTS = ['interleaved', 'separated'] as const;

test.each(
  ENCODINGS.flatMap(encoding =>
    DIMENSIONS.flatMap(dimension =>
      COORDINATE_LAYOUTS.map(coordinateLayout => ({encoding, dimension, coordinateLayout}))
    )
  )
)('builds the $encoding $dimension $coordinateLayout GeoArrow example', ({
  encoding,
  dimension,
  coordinateLayout
}) => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [makeGeometryWriter(encoding, dimension), null],
    {encoding, dimension, coordinateLayout}
  );
  const vector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));

  expect(geometryArray.length).toBe(2);
  expect(geometryArray.nullCount).toBe(1);
  expect(geometryArray.coordinateSize).toBe(dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3);
  expect(geometryArray.coordinateLayout).toBe(coordinateLayout);
  expect(vector.length).toBe(2);
  expect(vector.nullCount).toBe(1);

  if (encoding === 'geoarrow.box' && coordinateLayout === 'separated') {
    expect(geometryArray.coordinates).toEqual(
      expect.objectContaining({
        xmin: expect.any(Float64Array),
        ymin: expect.any(Float64Array),
        xmax: expect.any(Float64Array),
        ymax: expect.any(Float64Array)
      })
    );
  } else if (coordinateLayout === 'separated') {
    expect(geometryArray.coordinates).toEqual(
      expect.objectContaining({
        x: expect.any(Float64Array),
        y: expect.any(Float64Array)
      })
    );
  } else {
    expect(geometryArray.coordinates).toBeInstanceOf(Float64Array);
  }
});

function makeGeometryWriter(
  encoding: GeoArrowBuilderEncoding,
  dimension: GeoArrowBuilderDimension
): GeoArrowGeometryWriter {
  const writeCoordinate = (
    builder: Parameters<NonNullable<GeoArrowGeometryWriter>>[0],
    value: number
  ) =>
    builder.writeCoordinate(
      value,
      value + 1,
      dimension === 'xyz' || dimension === 'xyzm' ? value + 2 : undefined,
      dimension === 'xym' || dimension === 'xyzm' ? value + 3 : undefined
    );

  switch (encoding) {
    case 'geoarrow.point':
      return builder => {
        builder.beginPoint();
        writeCoordinate(builder, 0);
      };
    case 'geoarrow.multipoint':
      return builder => {
        builder.beginMultiPoint(2);
        writeCoordinate(builder, 0);
        writeCoordinate(builder, 10);
      };
    case 'geoarrow.linestring':
      return builder => {
        builder.beginLineString(2);
        writeCoordinate(builder, 0);
        writeCoordinate(builder, 10);
      };
    case 'geoarrow.multilinestring':
      return builder => {
        builder.beginMultiLineString(1);
        builder.beginLineString(2);
        writeCoordinate(builder, 0);
        writeCoordinate(builder, 10);
      };
    case 'geoarrow.polygon':
      return builder => {
        builder.beginPolygon(1);
        builder.beginLinearRing(4);
        writeCoordinate(builder, 0);
        writeCoordinate(builder, 10);
        writeCoordinate(builder, 20);
        writeCoordinate(builder, 0);
      };
    case 'geoarrow.multipolygon':
      return builder => {
        builder.beginMultiPolygon(1);
        builder.beginPolygon(1);
        builder.beginLinearRing(4);
        writeCoordinate(builder, 0);
        writeCoordinate(builder, 10);
        writeCoordinate(builder, 20);
        writeCoordinate(builder, 0);
      };
    case 'geoarrow.box':
      return builder => {
        builder.beginBox();
        builder.writeBox(
          0,
          1,
          10,
          11,
          dimension === 'xyz' || dimension === 'xyzm' ? 2 : undefined,
          dimension === 'xyz' || dimension === 'xyzm' ? 12 : undefined,
          dimension === 'xym' || dimension === 'xyzm' ? 3 : undefined,
          dimension === 'xym' || dimension === 'xyzm' ? 13 : undefined
        );
      };
    default:
      throw new Error(`Unsupported fixture encoding: ${encoding}`);
  }
}
