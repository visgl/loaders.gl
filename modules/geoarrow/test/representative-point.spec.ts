// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getRepresentativePoint} from '@loaders.gl/geoarrow';
import type {Geometry} from '@loaders.gl/schema';

test('point extraction is explicit, ignores extra ordinates, and rejects invalid/empty positions', () => {
  expect(getRepresentativePoint({type: 'Point', coordinates: [1, 2, 3]})).toEqual([1, 2]);
  expect(
    getRepresentativePoint({
      type: 'LineString',
      coordinates: [
        [0, 0],
        [2, 0]
      ]
    })
  ).toBeNull();
  for (const geometry of [
    null,
    {type: 'Point', coordinates: []},
    {type: 'Point', coordinates: [NaN, 1]},
    {type: 'MultiPoint', coordinates: []}
  ] as (Geometry | null)[])
    expect(getRepresentativePoint(geometry, 'centroid')).toBeNull();
});

test('polygon area centroid subtracts holes independently of ring winding', () => {
  const exterior = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0]
  ];
  const hole = [
    [6, 1],
    [9, 1],
    [9, 9],
    [6, 9],
    [6, 1]
  ];
  for (const ring of [hole, [...hole].reverse()]) {
    const centroid = getRepresentativePoint(
      {type: 'Polygon', coordinates: [exterior, ring]},
      'centroid'
    )!;
    expect(centroid[0]).toBeCloseTo((500 - 24 * 7.5) / 76);
    expect(centroid[1]).toBeCloseTo(5);
  }
  expect(
    getRepresentativePoint({type: 'Polygon', coordinates: [exterior, hole]}, 'bounds-center')
  ).toEqual([5, 5]);
  expect(
    getRepresentativePoint(
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [0, 0]
          ]
        ]
      },
      'centroid'
    )
  ).toEqual([1, 0]);
});

test('line centroid and midpoint use length and never bridge multipart gaps', () => {
  const line: Geometry = {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [6, 0],
      [6, 2]
    ]
  };
  expect(getRepresentativePoint(line, 'centroid')).toEqual([3.75, 0.25]);
  expect(getRepresentativePoint(line, 'line-midpoint')).toEqual([4, 0]);
  const multipart: Geometry = {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [2, 0]
      ],
      [
        [100, 0],
        [106, 0]
      ]
    ]
  };
  expect(getRepresentativePoint(multipart, 'line-midpoint')).toEqual([102, 0]);
  expect(getRepresentativePoint(multipart, 'centroid')).toEqual([77.5, 0]);
  expect(
    getRepresentativePoint(
      {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [1, 2]
        ]
      },
      'line-midpoint'
    )
  ).toEqual([1, 2]);
  expect(getRepresentativePoint({type: 'LineString', coordinates: [[1, 2]]}, 'centroid')).toEqual([
    1, 2
  ]);
  expect(
    getRepresentativePoint({type: 'MultiPoint', coordinates: [[0, 0]]}, 'line-midpoint')
  ).toBeNull();
});

test('multipart and collection representatives combine nonempty members with documented weights', () => {
  const polygons: Geometry = {
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
      ],
      [
        [
          [10, 0],
          [14, 0],
          [14, 4],
          [10, 4],
          [10, 0]
        ]
      ]
    ]
  };
  expect(getRepresentativePoint(polygons, 'centroid')).toEqual([9.8, 1.8]);
  expect(getRepresentativePoint(polygons, 'bounds-center')).toEqual([7, 2]);
  const collection: Geometry = {
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [0, 0]},
      {type: 'Point', coordinates: [10, 2]},
      {type: 'LineString', coordinates: []}
    ]
  };
  expect(getRepresentativePoint(collection, 'centroid')).toEqual([5, 1]);
  expect(
    getRepresentativePoint(
      {
        type: 'MultiPoint',
        coordinates: [
          [0, 0],
          [10, 2]
        ]
      },
      'centroid'
    )
  ).toEqual([5, 1]);
});
