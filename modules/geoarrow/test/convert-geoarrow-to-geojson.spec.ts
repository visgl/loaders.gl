// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {convertGeoArrowGeometryToGeoJSON} from '../src/lib/geometry-converters/convert-geoarrow-to-geojson';

const point = [1, 2];
const line = makeVector([
  [1, 2],
  [3, 4]
]);
const polygon = makeVector([line]);
const multiPoint = makeVector([point, null, [3, 4]]);
const multiLine = makeVector([line, makeVector([[5, 6]])]);
const multiPolygon = makeVector([polygon]);

test('convertGeoArrowGeometryToGeoJSON converts every GeoArrow geometry encoding', () => {
  expect(convertGeoArrowGeometryToGeoJSON(point, 'geoarrow.point')).toEqual({
    type: 'Point',
    coordinates: [1, 2]
  });
  expect(convertGeoArrowGeometryToGeoJSON(line, 'geoarrow.linestring')).toEqual({
    type: 'LineString',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  });
  expect(convertGeoArrowGeometryToGeoJSON(multiPoint, 'geoarrow.multipoint')).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  });
  expect(convertGeoArrowGeometryToGeoJSON(multiLine, 'geoarrow.multilinestring')).toEqual({
    type: 'MultiLineString',
    coordinates: [
      [
        [1, 2],
        [3, 4]
      ],
      [[5, 6]]
    ]
  });
  expect(convertGeoArrowGeometryToGeoJSON(polygon, 'geoarrow.polygon')).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [1, 2],
        [3, 4]
      ]
    ]
  });
  expect(convertGeoArrowGeometryToGeoJSON(multiPolygon, 'geoarrow.multipolygon')).toEqual({
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [1, 2],
          [3, 4]
        ]
      ]
    ]
  });
  expect(convertGeoArrowGeometryToGeoJSON('POINT (1 2)', 'geoarrow.wkt')).toEqual({
    type: 'Point',
    coordinates: [1, 2]
  });
});

test('convertGeoArrowGeometryToGeoJSON handles null and unsupported values', () => {
  expect(convertGeoArrowGeometryToGeoJSON(null, 'geoarrow.point')).toBeNull();
  expect(convertGeoArrowGeometryToGeoJSON(point)).toBeNull();
  expect(() => convertGeoArrowGeometryToGeoJSON(point, 'geoarrow.unsupported' as any)).toThrow(
    'GeoArrow encoding not supported'
  );
});

/** Creates the small vector interface used by Arrow nested list values. */
function makeVector(values: unknown[]): {length: number; get(index: number): unknown} {
  return {length: values.length, get: (index: number) => values[index]};
}
