// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryFeatureCollection,
  BinaryLineGeometry,
  BinaryPointGeometry,
  Feature
} from '@loaders.gl/schema';
import {describe, expect, test} from 'vitest';
import {getGeometryInfo} from '../../src/lib/geometry-api/geometry-info';
import {getBinaryGeometryInfo} from '../../src/lib/binary-geometry-api/binary-geometry-info';
import {convertBinaryGeometryToGeometry} from '../../src/lib/geometry-converters/convert-binary-geometry-to-geojson';
import {
  concatenateBinaryLineGeometries,
  concatenateBinaryPointGeometries,
  concatenateBinaryPolygonGeometries
} from '../../src/lib/binary-geometry-api/concat-binary-geometry';
import {
  transformBinaryCoords,
  transformGeoJsonCoords
} from '../../src/lib/binary-geometry-api/transform-coordinates';

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

describe('binary geometry utilities', () => {
  test('identifies single and multi binary geometries', () => {
    const point: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2]), size: 2}
    };
    const multiPoint: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2, 3, 4]), size: 2}
    };
    const line: BinaryLineGeometry = {
      type: 'LineString',
      positions: {value: new Float32Array([0, 0, 1, 1]), size: 2},
      pathIndices: {value: new Uint32Array([0]), size: 1}
    };
    const multiLine = {...line, pathIndices: {value: new Uint32Array([0, 1, 2]), size: 1}};
    const polygon = {
      type: 'Polygon' as const,
      positions: {value: new Float32Array([0, 0, 1, 0, 0, 0]), size: 2},
      polygonIndices: {value: new Uint32Array([0]), size: 1},
      primitivePolygonIndices: {value: new Uint32Array([0, 3]), size: 1}
    };
    const multiPolygon = {...polygon, polygonIndices: {value: new Uint32Array([0, 1, 2]), size: 1}};

    expect(getBinaryGeometryInfo(point).multiGeometryType).toBe('Point');
    expect(getBinaryGeometryInfo(multiPoint).multiGeometryType).toBe('MultiPoint');
    expect(getBinaryGeometryInfo(line).multiGeometryType).toBe('LineString');
    expect(getBinaryGeometryInfo(multiLine).multiGeometryType).toBe('MultiLineString');
    expect(getBinaryGeometryInfo(polygon).multiGeometryType).toBe('Polygon');
    expect(getBinaryGeometryInfo(multiPolygon).multiGeometryType).toBe('MultiPolygon');
  });

  test('concatenates point, line, and polygon geometry buffers', () => {
    const firstPoint: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float64Array([1, 2]), size: 2}
    };
    const secondPoint: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float64Array([3, 4]), size: 2}
    };
    expect(
      Array.from(concatenateBinaryPointGeometries([firstPoint, secondPoint], 2).positions.value)
    ).toEqual([1, 2, 3, 4]);

    const firstLine: BinaryLineGeometry = {
      type: 'LineString',
      positions: {value: new Float32Array([0, 0, 1, 1]), size: 2},
      pathIndices: {value: new Uint32Array([0, 2]), size: 1}
    };
    const secondLine: BinaryLineGeometry = {
      type: 'LineString',
      positions: {value: new Float32Array([2, 2, 3, 3, 4, 4]), size: 2},
      pathIndices: {value: new Uint32Array([0, 3]), size: 1}
    };
    expect(
      Array.from(concatenateBinaryLineGeometries([firstLine, secondLine], 2).pathIndices.value)
    ).toEqual([0, 2, 5]);

    const firstPolygon = {
      type: 'Polygon' as const,
      positions: {value: new Float32Array([0, 0, 1, 0, 0, 0]), size: 2},
      polygonIndices: {value: new Uint32Array([0, 1]), size: 1},
      primitivePolygonIndices: {value: new Uint32Array([0, 3]), size: 1}
    };
    const secondPolygon = {
      ...firstPolygon,
      positions: {value: new Float32Array([2, 2, 3, 2, 2, 2]), size: 2}
    };
    const concatenatedPolygon = concatenateBinaryPolygonGeometries(
      [firstPolygon, secondPolygon],
      2
    );
    expect(Array.from(concatenatedPolygon.polygonIndices.value)).toEqual([0, 3, 6]);
    expect(Array.from(concatenatedPolygon.primitivePolygonIndices.value)).toEqual([0, 3, 6]);
  });

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
      transformBinaryCoords(binaryFeatures, coord => coord.map(value => value * 2)).points
        ?.positions.value
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

  test('converts single and multi binary geometries to GeoJSON', () => {
    const point: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2]), size: 2}
    };
    const multiPoint: BinaryPointGeometry = {
      type: 'Point',
      positions: {value: new Float32Array([1, 2, 3, 4]), size: 2}
    };
    const line: BinaryLineGeometry = {
      type: 'LineString',
      positions: {value: new Float32Array([0, 0, 1, 1]), size: 2},
      pathIndices: {value: new Uint32Array([0, 2]), size: 1}
    };
    const multiLine: BinaryLineGeometry = {
      ...line,
      pathIndices: {value: new Uint32Array([0, 1, 2]), size: 1}
    };
    const polygon = {
      type: 'Polygon' as const,
      positions: {value: new Float32Array([0, 0, 1, 0, 0, 0]), size: 2},
      polygonIndices: {value: new Uint32Array([0, 1]), size: 1},
      primitivePolygonIndices: {value: new Uint32Array([0, 3]), size: 1}
    };
    const multiPolygon = {
      ...polygon,
      positions: {
        value: new Float32Array([0, 0, 1, 0, 0, 0, 2, 2, 3, 2, 2, 2]),
        size: 2
      },
      polygonIndices: {value: new Uint32Array([0, 3, 6]), size: 1},
      primitivePolygonIndices: {value: new Uint32Array([0, 3, 6]), size: 1}
    };

    expect(convertBinaryGeometryToGeometry(point)).toEqual({
      type: 'Point',
      coordinates: [1, 2]
    });
    expect(convertBinaryGeometryToGeometry(multiPoint)).toEqual({
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    });
    expect(convertBinaryGeometryToGeometry(line)).toEqual({
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1]
      ]
    });
    expect(convertBinaryGeometryToGeometry(multiLine)).toEqual({
      type: 'MultiLineString',
      coordinates: [[[0, 0]], [[1, 1]]]
    });
    expect(convertBinaryGeometryToGeometry(polygon)).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [0, 0]
        ]
      ]
    });
    expect(convertBinaryGeometryToGeometry(multiPolygon)).toEqual({
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
            [2, 2],
            [3, 2],
            [2, 2]
          ]
        ]
      ]
    });
    expect(convertBinaryGeometryToGeometry(multiPoint, 1, 2)).toEqual({
      type: 'Point',
      coordinates: [3, 4]
    });
  });
});
