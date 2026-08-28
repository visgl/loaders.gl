// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToFlatGeojson} from '@loaders.gl/gis';
// Sample GeoJSON data derived from examples in GeoJSON specification
// https://tools.ietf.org/html/rfc7946#appendix-A
// All features have 2D coordinates
const FEATURES_2D = '@loaders.gl/gis/test/data/binary-features/2d_features.json';
// All features have 3D coordinates
const FEATURES_3D = '@loaders.gl/gis/test/data/binary-features/3d_features.json';
// Some features have 3D coordinates
const FEATURES_MIXED = '@loaders.gl/gis/test/data/binary-features/mixed_features.json';
test('gis#geojson-to-flat-geojson 2D', async () => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const flatFeatures = geojsonToFlatGeojson(features);
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;
  // Point
  expect(point.geometry.data, 'flat Point data should be equivalent').toEqual([100, 0]);
  expect(point.geometry.indices, 'flat Point indices should be equivalent').toEqual([0]);
  // MultiPoint
  expect(multiPoint.geometry.data, 'flat MultiPoint data should be equivalent').toEqual([
    100, 0, 101, 1
  ]);
  expect(multiPoint.geometry.indices, 'flat MultiPoint indices should be equivalent').toEqual([
    0, 2
  ]);
  // LineString
  expect(lineString.geometry.data, 'flat LineString data should be equivalent').toEqual([
    100, 0, 101, 1
  ]);
  expect(lineString.geometry.indices, 'flat LineString indices should be equivalent').toEqual([0]);
  // MultiLineString
  expect(multiLineString.geometry.data, 'flat MultiLineString data should be equivalent').toEqual([
    100, 0, 101, 1, 102, 2, 103, 3
  ]);
  expect(
    multiLineString.geometry.indices,
    'flat MultiLineString indices should be equivalent'
  ).toEqual([0, 4]);
  // Polygon
  expect(polygon.geometry.data, 'flat Polygon data should be equivalent').toEqual([
    100, 0, 101, 0, 101, 1, 100, 1, 100, 0
  ]);
  expect(polygon.geometry.indices, 'flat Polygon indices should be equivalent').toEqual([[0]]);
  expect(polygon.geometry.areas, 'flat Polygon areas should be equivalent').toEqual([[-1]]);
  // Polygon (hole)
  expect(polygonWithHole.geometry.data, 'flat Polygon (hole) data should be equivalent').toEqual([
    100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2, 100.2, 0.8, 100.8,
    0.8
  ]);
  expect(
    polygonWithHole.geometry.indices,
    'flat Polygon (hole) indices should be equivalent'
  ).toEqual([[0, 10]]);
  expect(polygonWithHole.geometry.areas, 'flat Polygon (hole) areas should be equivalent').toEqual([
    [-1, 0.3599999999999966]
  ]);
  // MultiPolygon
  expect(multiPolygon.geometry.data, 'flat MultiPolygon data should be equivalent').toEqual([
    102, 2, 103, 2, 103, 3, 102, 3, 102, 2, 100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.2, 0.2,
    100.2, 0.8, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2
  ]);
  expect(multiPolygon.geometry.indices, 'flat MultiPolygon indices should be equivalent').toEqual([
    [0],
    [10, 20]
  ]);
  expect(multiPolygon.geometry.areas, 'flat MultiPolygon areas should be equivalent').toEqual([
    [-1],
    [-1, 0.3599999999999966]
  ]);
});
test('gis#geojson-to-flat-geojson 3D', async () => {
  const response = await fetchFile(FEATURES_3D);
  const {features} = await response.json();
  const flatFeatures = geojsonToFlatGeojson(features);
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;
  // Point
  expect(point.geometry.data, 'flat Point data should be equivalent').toEqual([100, 0, 1]);
  expect(point.geometry.indices, 'flat Point indices should be equivalent').toEqual([0]);
  // MultiPoint
  expect(multiPoint.geometry.data, 'flat MultiPoint data should be equivalent').toEqual([
    100, 0, 2, 101, 1, 3
  ]);
  expect(multiPoint.geometry.indices, 'flat MultiPoint indices should be equivalent').toEqual([
    0, 3
  ]);
  // LineString
  expect(lineString.geometry.data, 'flat LineString data should be equivalent').toEqual([
    100, 0, 4, 101, 1, 5
  ]);
  expect(lineString.geometry.indices, 'flat LineString indices should be equivalent').toEqual([0]);
  // MultiLineString
  expect(multiLineString.geometry.data, 'flat MultiLineString data should be equivalent').toEqual([
    100, 0, 6, 101, 1, 7, 102, 2, 8, 103, 3, 9
  ]);
  expect(
    multiLineString.geometry.indices,
    'flat MultiLineString indices should be equivalent'
  ).toEqual([0, 6]);
  // Polygon
  expect(polygon.geometry.data, 'flat Polygon data should be equivalent').toEqual([
    100, 0, 10, 101, 0, 11, 101, 1, 12, 100, 1, 13, 100, 0, 14
  ]);
  expect(polygon.geometry.indices, 'flat Polygon indices should be equivalent').toEqual([[0]]);
  expect(polygon.geometry.areas, 'flat Polygon areas should be equivalent').toEqual([[-1]]);
  // Polygon (hole)
  expect(polygonWithHole.geometry.data, 'flat Polygon (hole) data should be equivalent').toEqual([
    100, 0, 15, 101, 0, 16, 101, 1, 17, 100, 1, 18, 100, 0, 19, 100.8, 0.8, 20, 100.8, 0.2, 21,
    100.2, 0.2, 22, 100.2, 0.8, 23, 100.8, 0.8, 24
  ]);
  expect(
    polygonWithHole.geometry.indices,
    'flat Polygon (hole) indices should be equivalent'
  ).toEqual([[0, 15]]);
  expect(polygonWithHole.geometry.areas, 'flat Polygon (hole) areas should be equivalent').toEqual([
    [-1, 0.3599999999999966]
  ]);
  // MultiPolygon
  expect(multiPolygon.geometry.data, 'flat MultiPolygon data should be equivalent').toEqual([
    102, 2, 25, 103, 2, 26, 103, 3, 27, 102, 3, 28, 102, 2, 29, 100, 0, 30, 101, 0, 31, 101, 1, 32,
    100, 1, 33, 100, 0, 34, 100.2, 0.2, 35, 100.2, 0.8, 36, 100.8, 0.8, 37, 100.8, 0.2, 38, 100.2,
    0.2, 39
  ]);
  expect(multiPolygon.geometry.indices, 'flat MultiPolygon indices should be equivalent').toEqual([
    [0],
    [15, 30]
  ]);
  expect(multiPolygon.geometry.areas, 'flat MultiPolygon areas should be equivalent').toEqual([
    [-1],
    [-1, 0.3599999999999966]
  ]);
});
test('gis#geojson-to-flat-geojson Mixed', async () => {
  const response = await fetchFile(FEATURES_MIXED);
  const {features} = await response.json();
  const flatFeatures = geojsonToFlatGeojson(features, {coordLength: 3});
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;
  // Point
  expect(point.geometry.data, 'flat Point data should be equivalent').toEqual([100, 0, 1]);
  expect(point.geometry.indices, 'flat Point indices should be equivalent').toEqual([0]);
  // MultiPoint
  expect(multiPoint.geometry.data, 'flat MultiPoint data should be equivalent').toEqual([
    100, 0, 0, 101, 1, 0
  ]);
  expect(multiPoint.geometry.indices, 'flat MultiPoint indices should be equivalent').toEqual([
    0, 3
  ]);
  // LineString
  expect(lineString.geometry.data, 'flat LineString data should be equivalent').toEqual([
    100, 0, 0, 101, 1, 0
  ]);
  expect(lineString.geometry.indices, 'flat LineString indices should be equivalent').toEqual([0]);
  // MultiLineString
  expect(multiLineString.geometry.data, 'flat MultiLineString data should be equivalent').toEqual([
    100, 0, 2, 101, 1, 0, 102, 2, 0, 103, 3, 0
  ]);
  expect(
    multiLineString.geometry.indices,
    'flat MultiLineString indices should be equivalent'
  ).toEqual([0, 6]);
  // Polygon
  expect(polygon.geometry.data, 'flat Polygon data should be equivalent').toEqual([
    100, 0, 0, 101, 0, 0, 101, 1, 0, 100, 1, 0, 100, 0, 3
  ]);
  expect(polygon.geometry.indices, 'flat Polygon indices should be equivalent').toEqual([[0]]);
  expect(polygon.geometry.areas, 'flat Polygon areas should be equivalent').toEqual([[-1]]);
  // Polygon (hole)
  expect(polygonWithHole.geometry.data, 'flat Polygon (hole) data should be equivalent').toEqual([
    100, 0, 0, 101, 0, 0, 101, 1, 0, 100, 1, 0, 100, 0, 0, 100.8, 0.8, 0, 100.8, 0.2, 0, 100.2, 0.2,
    0, 100.2, 0.8, 0, 100.8, 0.8, 0
  ]);
  expect(
    polygonWithHole.geometry.indices,
    'flat Polygon (hole) indices should be equivalent'
  ).toEqual([[0, 15]]);
  expect(polygonWithHole.geometry.areas, 'flat Polygon (hole) areas should be equivalent').toEqual([
    [-1, 0.3599999999999966]
  ]);
  // MultiPolygon
  expect(multiPolygon.geometry.data, 'flat MultiPolygon data should be equivalent').toEqual([
    102, 2, 0, 103, 2, 0, 103, 3, 0, 102, 3, 0, 102, 2, 0, 100, 0, 0, 101, 0, 0, 101, 1, 0, 100, 1,
    0, 100, 0, 0, 100.2, 0.2, 0, 100.2, 0.8, 0, 100.8, 0.8, 0, 100.8, 0.2, 0, 100.2, 0.2, 0
  ]);
  expect(multiPolygon.geometry.indices, 'flat MultiPolygon indices should be equivalent').toEqual([
    [0],
    [15, 30]
  ]);
  expect(multiPolygon.geometry.areas, 'flat MultiPolygon areas should be equivalent').toEqual([
    [-1],
    [-1, 0.3599999999999966]
  ]);
});
// eslint-disable-next-line max-statements
test('gis#geojson-to-flat-geojson winding', async () => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const polygons = features.slice(4);
  // Manually reverse winding for all shapes
  for (const {geometry} of polygons) {
    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach(shape => shape.reverse());
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(g => {
        g.forEach(shape => shape.reverse());
      });
    }
  }
  let flatFeatures = geojsonToFlatGeojson(JSON.parse(JSON.stringify(polygons)), {
    fixRingWinding: true
  });
  let [polygon, polygonWithHole, multiPolygon] = flatFeatures;
  // Polygon
  expect(polygon.geometry.data, 'flat Polygon data should be equivalent').toEqual([
    100, 0, 101, 0, 101, 1, 100, 1, 100, 0
  ]);
  expect(polygon.geometry.indices, 'flat Polygon indices should be equivalent').toEqual([[0]]);
  expect(polygon.geometry.areas, 'flat Polygon areas should be equivalent').toEqual([[-1]]);
  // Polygon (hole)
  expect(polygonWithHole.geometry.data, 'flat Polygon (hole) data should be equivalent').toEqual([
    100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2, 100.2, 0.8, 100.8,
    0.8
  ]);
  expect(
    polygonWithHole.geometry.indices,
    'flat Polygon (hole) indices should be equivalent'
  ).toEqual([[0, 10]]);
  expect(polygonWithHole.geometry.areas, 'flat Polygon (hole) areas should be equivalent').toEqual([
    [-1, 0.3599999999999966]
  ]);
  // MultiPolygon
  expect(multiPolygon.geometry.data, 'flat MultiPolygon data should be equivalent').toEqual([
    102, 2, 103, 2, 103, 3, 102, 3, 102, 2, 100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.2, 0.2,
    100.2, 0.8, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2
  ]);
  expect(multiPolygon.geometry.indices, 'flat MultiPolygon indices should be equivalent').toEqual([
    [0],
    [10, 20]
  ]);
  expect(multiPolygon.geometry.areas, 'flat MultiPolygon areas should be equivalent').toEqual([
    [-1],
    [-1, 0.3599999999999966]
  ]);
  // Repeat tests without ring winding fix
  flatFeatures = geojsonToFlatGeojson(polygons, {fixRingWinding: false});
  [polygon, polygonWithHole, multiPolygon] = flatFeatures;
  // Polygon
  expect(polygon.geometry.data, 'flat Polygon data should be reversed').toEqual([
    100, 0, 100, 1, 101, 1, 101, 0, 100, 0
  ]);
  expect(polygon.geometry.indices, 'flat Polygon indices should be equivalent').toEqual([[0]]);
  expect(polygon.geometry.areas, 'flat Polygon areas should be negated').toEqual([[1]]);
  // Polygon (hole)
  expect(polygonWithHole.geometry.data, 'flat Polygon (hole) data should be reversed').toEqual([
    100, 0, 100, 1, 101, 1, 101, 0, 100, 0, 100.8, 0.8, 100.2, 0.8, 100.2, 0.2, 100.8, 0.2, 100.8,
    0.8
  ]);
  expect(
    polygonWithHole.geometry.indices,
    'flat Polygon (hole) indices should be equivalent'
  ).toEqual([[0, 10]]);
  expect(polygonWithHole.geometry.areas, 'flat Polygon (hole) areas should be negated').toEqual([
    [1, -0.3599999999999966]
  ]);
  // MultiPolygon
  expect(multiPolygon.geometry.data, 'flat MultiPolygon data should be reversed').toEqual([
    102, 2, 102, 3, 103, 3, 103, 2, 102, 2, 100, 0, 100, 1, 101, 1, 101, 0, 100, 0, 100.2, 0.2,
    100.8, 0.2, 100.8, 0.8, 100.2, 0.8, 100.2, 0.2
  ]);
  expect(multiPolygon.geometry.indices, 'flat MultiPolygon indices should be equivalent').toEqual([
    [0],
    [10, 20]
  ]);
  expect(multiPolygon.geometry.areas, 'flat MultiPolygon areas should be negated').toEqual([
    [1],
    [1, -0.3599999999999966]
  ]);
});
test('gis#geojson-to-flat-geojson invalid type', async () => {
  const features = [
    {
      id: 0,
      type: 'Feature',
      geometry: {
        type: 'GeometryCollection',
        coordinates: []
      }
    }
  ];
  expect(() => geojsonToFlatGeojson(features), 'throws when type is GeometryCollection').toThrow();
  features[0].geometry.type = 'Invalid';
  expect(() => geojsonToFlatGeojson(features), 'throws when type is Invalid').toThrow();
});
