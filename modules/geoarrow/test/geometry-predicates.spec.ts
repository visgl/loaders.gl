// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Geometry} from '@loaders.gl/schema';
import {intersectsCoordinate, intersectsExtent} from '../src/lib/geometry-predicates';

const polygon: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0]
    ],
    [
      [2, 2],
      [8, 2],
      [8, 8],
      [2, 8],
      [2, 2]
    ]
  ]
};

test.each([
  {coordinate: [1, 1], matches: true},
  {coordinate: [5, 5], matches: false},
  {coordinate: [0, 5], matches: true},
  {coordinate: [2, 5], matches: true},
  {coordinate: [10, 10], matches: true},
  {coordinate: [-1, 5], matches: false}
])('polygon coordinate $coordinate matches=$matches', ({coordinate, matches}) => {
  expect(intersectsCoordinate(polygon, coordinate)).toBe(matches);
});

test.each([
  {extent: [3, 3, 7, 7], matches: false},
  {extent: [1, 1, 1.5, 1.5], matches: true},
  {extent: [-1, -1, 11, 11], matches: true},
  {extent: [10, 5, 11, 6], matches: true},
  {extent: [2, 3, 2, 7], matches: true},
  {extent: [5, 5, 5, 5], matches: false},
  {extent: [5, 0, 5, 0], matches: true},
  {extent: [11, 11, 12, 12], matches: false}
])('polygon extent $extent matches=$matches', ({extent, matches}) => {
  expect(intersectsExtent(polygon, extent as [number, number, number, number])).toBe(matches);
});

test('lines crossing extents, diagonal bounds false positives, collinear and degenerate segments', () => {
  const line: Geometry = {
    type: 'LineString',
    coordinates: [
      [-10, -10],
      [10, 10]
    ]
  };
  expect(intersectsExtent(line, [-1, -1, 1, 1])).toBe(true);
  expect(intersectsExtent(line, [-5, 4, -4, 5])).toBe(false);
  expect(intersectsExtent(line, [2, 2, 4, 4])).toBe(true);
  expect(intersectsExtent(line, [2, 2, 2, 2])).toBe(true);
  expect(intersectsCoordinate(line, [4, 4])).toBe(true);
  expect(intersectsCoordinate(line, [4, 5])).toBe(false);
  expect(
    intersectsCoordinate(
      {
        type: 'LineString',
        coordinates: [
          [1, 1],
          [1, 1]
        ]
      },
      [1, 1]
    )
  ).toBe(true);
  expect(intersectsCoordinate({type: 'LineString', coordinates: [[1, 1]]}, [1, 1])).toBe(true);
});

test('concave polygon and implicit ring closure avoid bounds-only matches', () => {
  const concave: Geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 1],
        [1, 1],
        [1, 4],
        [0, 4]
      ]
    ]
  };
  expect(intersectsExtent(concave, [2, 2, 3, 3])).toBe(false);
  expect(intersectsCoordinate(concave, [0, 2])).toBe(true);
  expect(intersectsExtent(concave, [-1, 2, 0, 3])).toBe(true);
});

test.each([
  {type: 'Point', coordinates: [1, 1, 99]},
  {
    type: 'MultiPoint',
    coordinates: [
      [20, 20],
      [1, 1]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [2, 2]
      ],
      [
        [20, 20],
        [30, 30]
      ]
    ]
  },
  {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0]
        ]
      ]
    ]
  },
  {
    type: 'GeometryCollection',
    geometries: [{type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [1, 1]}]}]
  }
] as Geometry[])('$type supports coordinate and extent predicates, ignoring Z', geometry => {
  expect(intersectsCoordinate(geometry, [1, 1])).toBe(true);
  expect(intersectsCoordinate(geometry, [40, 40])).toBe(false);
  expect(intersectsExtent(geometry, [0.5, 0.5, 1.5, 1.5])).toBe(true);
  expect(intersectsExtent(geometry, [40, 40, 41, 41])).toBe(false);
});

test.each([
  {type: 'Point', coordinates: []},
  {type: 'MultiPoint', coordinates: []},
  {type: 'LineString', coordinates: []},
  {type: 'MultiLineString', coordinates: []},
  {type: 'Polygon', coordinates: []},
  {type: 'Polygon', coordinates: [[]]},
  {type: 'MultiPolygon', coordinates: []},
  {type: 'GeometryCollection', geometries: []}
] as Geometry[])('empty $type never intersects', geometry => {
  expect(intersectsCoordinate(geometry, [0, 0])).toBe(false);
  expect(intersectsExtent(geometry, [-1, -1, 1, 1])).toBe(false);
});
