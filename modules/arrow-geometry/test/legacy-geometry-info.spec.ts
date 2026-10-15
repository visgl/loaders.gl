// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature} from '@loaders.gl/schema';
import {describe, expect, test} from 'vitest';
import {getGeometryInfo} from '../src/legacy-binary';

describe('getGeometryInfo', () => {
  test('counts every GeoJSON geometry family and coordinate dimension', () => {
    const features: Feature[] = [
      {type: 'Feature', geometry: {type: 'Point', coordinates: [1, 2, 3]}, properties: {}},
      {
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: [
            [0, 0],
            [1, 1, 1]
          ]
        },
        properties: {}
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1]
          ]
        },
        properties: {}
      },
      {
        type: 'Feature',
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [
              [0, 0],
              [1, 1]
            ],
            [
              [2, 2, 2],
              [3, 3, 3]
            ]
          ]
        },
        properties: {}
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [0, 0]
            ]
          ]
        },
        properties: {}
      },
      {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [0, 0],
                [1, 0],
                [0, 0]
              ]
            ],
            [
              [
                [2, 2, 2],
                [3, 2, 2],
                [2, 2, 2]
              ]
            ]
          ]
        },
        properties: {}
      }
    ];

    expect(getGeometryInfo(features)).toEqual({
      coordLength: 3,
      pointPositionsCount: 3,
      pointFeaturesCount: 2,
      linePositionsCount: 6,
      linePathsCount: 3,
      lineFeaturesCount: 2,
      polygonPositionsCount: 9,
      polygonObjectsCount: 3,
      polygonRingsCount: 3,
      polygonFeaturesCount: 2
    });
    expect(getGeometryInfo([]).coordLength).toBe(2);
  });
});
