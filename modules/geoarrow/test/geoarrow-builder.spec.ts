// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {GeoArrowBuilder} from '@loaders.gl/geoarrow';

test('GeoArrowBuilder measures and writes point buffers without GIS dependencies', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginPoint();
        builder.writeCoordinate(1, 2);
      },
      null
    ],
    {encoding: 'geoarrow.point'}
  );

  expect(geometryArray.length).toBe(2);
  expect(geometryArray.nullCount).toBe(1);
  expect(Array.from(geometryArray.coordinates)).toEqual([1, 2, 0, 0]);

  const vector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
  expect(vector.get(0)?.toArray()).toEqual(new Float64Array([1, 2]));
  expect(vector.get(1)).toBeNull();
});

test('GeoArrowBuilder emits nested offsets and XYM coordinates', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginLineString(2);
        builder.writeCoordinate(1, 2, undefined, 7);
        builder.writeCoordinate(3, 4, undefined, 8);
      }
    ],
    {encoding: 'geoarrow.linestring', dimension: 'xym'}
  );

  expect(Array.from(geometryArray.coordinates)).toEqual([1, 2, 7, 3, 4, 8]);
  expect(Array.from(geometryArray.geometryOffsets || [])).toEqual([0, 2]);
  const vector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
  expect(vector.type.toString()).toBe('List<FixedSizeList[3]<Float64>>');
});

test('GeoArrowBuilder emits separated coordinates and 64-bit offsets', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginLineString(2);
        builder.writeCoordinate(1, 2);
        builder.writeCoordinate(3, 4);
      }
    ],
    {encoding: 'geoarrow.linestring', coordinateLayout: 'separated', offsetType: 'int64'}
  );

  expect(geometryArray.coordinateLayout).toBe('separated');
  expect(geometryArray.offsetType).toBe('int64');
  expect(geometryArray.coordinates).toMatchObject({
    x: new Float64Array([1, 3]),
    y: new Float64Array([2, 4])
  });
  expect(geometryArray.geometryOffsets).toBeInstanceOf(BigInt64Array);

  const vector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
  expect(vector.type.toString()).toBe('LargeList<Struct<{x:Float64, y:Float64}>>');
  expect(vector.get(0)?.get(1)).toMatchObject({x: 3, y: 4});
});

test('GeoArrowBuilder emits canonical XYM box structs', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginBox();
        builder.writeBox(1, 2, 3, 4, undefined, undefined, 7, 8);
      },
      null
    ],
    {encoding: 'geoarrow.box', dimension: 'xym', coordinateLayout: 'interleaved'}
  );

  expect(Array.from(geometryArray.coordinates as Float64Array)).toEqual([1, 2, 7, 3, 4, 8]);
  expect(geometryArray.geometryOffsets).toBeUndefined();

  const vector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
  expect(vector.type.toString()).toContain('Struct');
  expect(vector.get(0)).toMatchObject({xmin: 1, ymin: 2, mmin: 7, xmax: 3, ymax: 4, mmax: 8});
  expect(vector.get(1)).toBeNull();
});

test('GeoArrowBuilder emits separated XYZM box buffers', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginBox();
        builder.writeBox(1, 2, 3, 4, 5, 6, 7, 8);
      }
    ],
    {encoding: 'geoarrow.box', dimension: 'xyzm', coordinateLayout: 'separated'}
  );

  expect(geometryArray.coordinates).toMatchObject({
    xmin: new Float64Array([1]),
    ymin: new Float64Array([2]),
    zmin: new Float64Array([5]),
    mmin: new Float64Array([7]),
    xmax: new Float64Array([3]),
    ymax: new Float64Array([4]),
    zmax: new Float64Array([6]),
    mmax: new Float64Array([8])
  });

  const vector = arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
  expect(vector.get(0)).toMatchObject({xmin: 1, zmin: 5, mmin: 7, xmax: 3, zmax: 6, mmax: 8});
});
