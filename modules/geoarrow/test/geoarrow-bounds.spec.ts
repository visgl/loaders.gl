// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  getGeoArrowFieldInfo,
  getGeoArrowRowBounds,
  validateGeoArrowField,
  validateGeoArrowVector
} from '@loaders.gl/geoarrow';

test('getGeoArrowRowBounds reads sliced separated native points', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [3, 4]}}
  ]);
  const native = convertGeoArrowGeometry(source.data, 'geoarrow.point', {
    coordinates: 'separated'
  });
  const geometry = native.getChild('geometry')?.slice(1, 2);

  expect(geometry).toBeTruthy();
  expect(getGeoArrowRowBounds(geometry!, 'geoarrow.point')).toEqual([[3, 4, 3, 4]]);
});

test('getGeoArrowRowBounds reads sliced interleaved native points', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [3, 4]}}
  ]);
  const native = convertGeoArrowGeometry(source.data, 'geoarrow.point');
  const geometry = native.getChild('geometry')?.slice(1, 2);

  expect(geometry).toBeTruthy();
  expect(getGeoArrowRowBounds(geometry!, 'geoarrow.point')).toEqual([[3, 4, 3, 4]]);
});

test('getGeoArrowRowBounds reads nested native lines with large offsets', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {id: 1},
      geometry: {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [5, 6]
        ]
      }
    }
  ]);
  const native = convertGeoArrowGeometry(source.data, 'geoarrow.linestring', {
    offsetType: 'int64'
  });
  const geometry = native.getChild('geometry');

  expect(geometry).toBeTruthy();
  expect(getGeoArrowRowBounds(geometry!, 'geoarrow.linestring')).toEqual([[1, 2, 5, 6]]);
});

test('getGeoArrowRowBounds reads a sliced nested native line', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {id: 1},
      geometry: {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [2, 3]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {id: 2},
      geometry: {
        type: 'LineString',
        coordinates: [
          [7, 8],
          [9, 10]
        ]
      }
    }
  ]);
  const native = convertGeoArrowGeometry(source.data, 'geoarrow.linestring');
  const geometry = native.getChild('geometry')?.slice(1, 2);

  expect(geometry).toBeTruthy();
  expect(getGeoArrowRowBounds(geometry!, 'geoarrow.linestring')).toEqual([[7, 8, 9, 10]]);
});

test('getGeoArrowRowBounds walks mixed unions and collections in buffers', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {type: 'Point', coordinates: [1, 2]}
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'LineString',
            coordinates: [
              [-4, 3],
              [8, 9]
            ]
          }
        ]
      }
    }
  ]).data;
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
  const collectionSource = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [1, 2]}]}
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'LineString',
            coordinates: [
              [-4, 3],
              [8, 9]
            ]
          }
        ]
      }
    }
  ]).data;
  const collection = convertGeoArrowGeometry(collectionSource, 'geoarrow.geometrycollection');

  expect(getGeoArrowRowBounds(union.getChild('geometry')!, 'geoarrow.geometry')).toEqual([
    [1, 2, 1, 2],
    [-4, 3, 8, 9]
  ]);
  expect(
    getGeoArrowRowBounds(collection.getChild('geometry')!, 'geoarrow.geometrycollection')
  ).toEqual([
    [1, 2, 1, 2],
    [-4, 3, 8, 9]
  ]);
});

test('getGeoArrowRowBounds reads sliced nullable XYZM boxes directly', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {type: 'Point', coordinates: [1, 2, 3, 4]}
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {type: 'Point', coordinates: [7, 8, 9, 10]}
    }
  ]).data;
  const boxes = convertGeoArrowGeometry(source, 'geoarrow.box', {dimension: 'xyzm'});
  const geometry = boxes.getChild('geometry');
  const field = boxes.schema.fields.find(candidate => candidate.name === 'geometry');

  expect(geometry).toBeTruthy();
  expect(field).toBeTruthy();
  expect(getGeoArrowFieldInfo(field!)?.dimension).toBe('xyzm');
  expect(validateGeoArrowField(field!).valid).toBe(true);
  expect(validateGeoArrowVector(geometry!.slice(1, 2), 'geoarrow.box').valid).toBe(true);
  expect(getGeoArrowRowBounds(geometry!.slice(1, 2), 'geoarrow.box')).toEqual([[7, 8, 7, 8]]);
});
