import {expect, test} from 'vitest';
import type {BinaryFeatureCollection, Feature} from '@loaders.gl/core/schema';
import {
  transformBinaryCoords,
  transformGeoJsonCoords
} from '@loaders.gl/arrow-geometry/legacy-binary';

test('transforms binary and nested GeoJSON coordinates in place', () => {
  const binaryFeatures: BinaryFeatureCollection = {
    shape: 'binary-feature-collection',
    points: {
      type: 'Point',
      positions: {value: new Float32Array([1, 2, 3, 4]), size: 2},
      featureIds: {value: new Uint32Array([0, 1]), size: 1},
      globalFeatureIds: {value: new Uint32Array([0, 1]), size: 1},
      numericProps: {},
      properties: []
    }
  };
  expect(
    transformBinaryCoords(binaryFeatures, coord => coord.map(value => value * 2)).points?.positions
      .value
  ).toEqual(new Float32Array([2, 4, 6, 8]));

  const features: Feature[] = [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [1, 2],
            [3, 4],
            [1, 2]
          ]
        ]
      },
      properties: {}
    }
  ];
  expect(
    transformGeoJsonCoords(features, coord => coord.map(value => value + 1))[0].geometry
  ).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [2, 3],
        [4, 5],
        [2, 3]
      ]
    ]
  });
});
