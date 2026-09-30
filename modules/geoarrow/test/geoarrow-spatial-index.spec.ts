// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {
  GeoArrowSpatialIndex,
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry
} from '@loaders.gl/geoarrow';
import type {Geometry} from '@loaders.gl/schema';

let index: GeoArrowSpatialIndex;
beforeAll(() => {
  const geometries: (Geometry | null)[] = [
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [10, 0]
      ]
    },
    {
      type: 'Polygon',
      coordinates: [
        [
          [20, 0],
          [30, 0],
          [30, 10],
          [20, 10],
          [20, 0]
        ],
        [
          [22, 2],
          [28, 2],
          [28, 8],
          [22, 8],
          [22, 2]
        ]
      ]
    },
    {type: 'Point', coordinates: [1000, 1000]},
    null,
    {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'MultiPoint',
          coordinates: [
            [40, 0],
            [50, 0]
          ]
        }
      ]
    }
  ];
  const table = convertFeaturesToGeoArrowTable(
    geometries.map(geometry => ({type: 'Feature', properties: {}, geometry}))
  );
  index = new GeoArrowSpatialIndex(table.data.getChild('geometry')!, 'geoarrow.wkb', [
    1,
    '1',
    2,
    1,
    null
  ]);
});

test('spatial queries include offscreen rows, duplicate IDs, null geometry and boundary contact', () => {
  expect(index.getFeatureRowsById(1)).toEqual([0, 3]);
  expect(index.getFeatureRowsById('1')).toEqual([1]);
  expect(index.getFeatureRowsById('missing')).toEqual([]);
  const rows = index.getFeatureRowsById(1);
  rows.pop();
  expect(index.getFeatureRowsById(1)).toEqual([0, 3]);
  expect(index.getFeatureRowsInExtent([999, 999, 1001, 1001])).toEqual([2]);
  expect(index.getFeatureRowsInExtent([10, 0, 20, 0])).toEqual([0, 1]);
  expect(index.getFeatureRowsInExtent([24, 4, 26, 6])).toEqual([1]); // Bounds, not polygon intersection.
});

test('nearest geometry supports snapping to segments, filled polygons, holes and collections', () => {
  expect(index.getClosestFeature([5, 2])).toEqual({rowIndex: 0, coordinate: [5, 0], distance: 2});
  expect(index.getClosestFeature([21, 1])).toEqual({rowIndex: 1, coordinate: [21, 1], distance: 0});
  expect(index.getClosestFeature([25, 5])?.distance).toBe(3);
  expect(index.getClosestFeature([49, 0])).toEqual({rowIndex: 4, coordinate: [50, 0], distance: 1});
  expect(index.getClosestFeature([5, 2], {maxDistance: 1})).toBeNull();
  expect(index.getClosestFeature([5, 2], {maxDistance: 2})?.rowIndex).toBe(0);
  expect(index.getClosestFeature([5, 2], {filter: rowIndex => rowIndex === 2})?.rowIndex).toBe(2);
});

test('native sliced vectors use local row indices and deterministic nearest ties', () => {
  const table = convertFeaturesToGeoArrowTable(
    [0, 2, 4].map(value => ({
      type: 'Feature',
      properties: {},
      geometry: {type: 'Point', coordinates: [value, 0]}
    }))
  );
  const native = convertGeoArrowGeometry(table.data, 'geoarrow.point', {coordinates: 'separated'});
  const column = native.getChild('geometry')!.slice(1);
  const slicedIndex = new GeoArrowSpatialIndex(column, 'geoarrow.point');
  expect(slicedIndex.getClosestFeature([3, 0])?.rowIndex).toBe(0);
  expect(slicedIndex.getFeatureRowsInExtent([4, 0, 4, 0])).toEqual([1]);
  expect(() => new GeoArrowSpatialIndex(column, 'geoarrow.point', [1])).toThrow('length');
});

test('spatial queries reject invalid query coordinates and limits', () => {
  expect(() => index.getFeatureRowsInExtent([1, 0, 0, 1])).toThrow('ordered');
  expect(() => index.getClosestFeature([NaN, 0])).toThrow('finite');
  expect(() => index.getClosestFeature([0, 0], {maxDistance: -1})).toThrow('nonnegative');
});

test.each([
  {
    type: 'LineString',
    coordinates: [
      [2, 0],
      [2, 0]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [2, -1],
        [2, 1]
      ]
    ]
  },
  {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [2, -1],
          [4, -1],
          [4, 1],
          [2, 1],
          [2, -1]
        ]
      ]
    ]
  }
] as Geometry[])('nearest $type handles multipart and degenerate segments', geometry => {
  const table = convertFeaturesToGeoArrowTable([{type: 'Feature', properties: {}, geometry}]);
  const query = new GeoArrowSpatialIndex(table.data.getChild('geometry')!, 'geoarrow.wkb');
  expect(query.getClosestFeature([0, 0])).toEqual({rowIndex: 0, coordinate: [2, 0], distance: 2});
});

test('null geometries and empty collections have no nearest match', () => {
  const table = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {}, geometry: null},
    {type: 'Feature', properties: {}, geometry: {type: 'GeometryCollection', geometries: []}}
  ]);
  const query = new GeoArrowSpatialIndex(table.data.getChild('geometry')!, 'geoarrow.wkb');
  expect(query.getClosestFeature([0, 0])).toBeNull();
  expect(query.getFeatureRowsInExtent([-1, -1, 1, 1])).toEqual([]);
});

test('WKT queries normalize serialized geometry without losing row alignment', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {}, geometry: null},
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [5, 6]}}
  ]);
  const table = convertGeoArrowGeometry(source.data, 'geoarrow.wkt');
  const query = new GeoArrowSpatialIndex(table.getChild('geometry')!, 'geoarrow.wkt', [
    'empty',
    'point'
  ]);
  expect(query.getFeatureRowsInExtent([5, 6, 5, 6])).toEqual([1]);
  expect(query.getClosestFeature([5, 7])).toEqual({rowIndex: 1, coordinate: [5, 6], distance: 1});
});

test('exact queries refine candidates, include hole boundaries and retain offscreen rows', () => {
  expect(index.getFeatureRowsIntersectingExtent([24, 4, 26, 6])).toEqual([]);
  expect(index.getFeatureRowsIntersectingExtent([21, 3, 22, 6])).toEqual([1]);
  expect(index.getFeatureRowsAtCoordinate([25, 5])).toEqual([]);
  expect(index.getFeatureRowsAtCoordinate([22, 5])).toEqual([1]);
  expect(index.getFeatureRowsAtCoordinate([5, 0])).toEqual([0]);
  expect(index.getFeatureRowsAtCoordinate([1000, 1000])).toEqual([2]);
  expect(index.getFeatureRowsIntersectingExtent([45, -1, 46, 1])).toEqual([]);
  expect(() => index.getFeatureRowsAtCoordinate([NaN, 0])).toThrow('finite');
  expect(() => index.getFeatureRowsAtCoordinate([Infinity, 0])).toThrow('finite');
  expect(() => index.getFeatureRowsIntersectingExtent([2, 0, 1, 1])).toThrow('ordered');
});

test('exact queries work on native sliced vectors and normalized WKT', () => {
  const table = convertFeaturesToGeoArrowTable(
    [0, 2, 4].map(value => ({
      type: 'Feature',
      properties: {},
      geometry: {type: 'Point', coordinates: [value, 0]}
    }))
  );
  for (const encoding of ['geoarrow.point', 'geoarrow.wkt'] as const) {
    const converted = convertGeoArrowGeometry(table.data, encoding);
    const sliced = new GeoArrowSpatialIndex(converted.getChild('geometry')!.slice(1), encoding);
    expect(sliced.getFeatureRowsAtCoordinate([2, 0])).toEqual([0]);
    expect(sliced.getFeatureRowsIntersectingExtent([3, -1, 5, 1])).toEqual([1]);
  }
});
