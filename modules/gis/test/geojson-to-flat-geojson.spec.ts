// @ts-nocheck
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToFlatGeojson} from '@loaders.gl/gis';

// Sample GeoJSON data derived from examples in GeoJSON specification
// https://tools.ietf.org/html/rfc7946#appendix-A
// All features have 2D coordinates
const FEATURES_2D = '@loaders.gl/gis/test/data/2d_features.json';
// All features have 3D coordinates
const FEATURES_3D = '@loaders.gl/gis/test/data/3d_features.json';
// Some features have 3D coordinates
const FEATURES_MIXED = '@loaders.gl/gis/test/data/mixed_features.json';

test('gis#geojson-to-flat-geojson 2D', async (t) => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();

  const flatFeatures = geojsonToFlatGeojson(features);
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;

  // Point
  t.deepEquals(point.geometry.data, [100, 0], 'flat Point data should be equivalent');
  t.deepEquals(point.geometry.indices, [0], 'flat Point indices should be equivalent');

  // MultiPoint
  t.deepEquals(
    multiPoint.geometry.data,
    [100, 0, 101, 1],
    'flat MultiPoint data should be equivalent'
  );
  t.deepEquals(multiPoint.geometry.indices, [0, 2], 'flat MultiPoint indices should be equivalent');

  // LineString
  t.deepEquals(
    lineString.geometry.data,
    [100, 0, 101, 1],
    'flat LineString data should be equivalent'
  );
  t.deepEquals(lineString.geometry.indices, [0], 'flat LineString indices should be equivalent');

  // MultiLineString
  t.deepEquals(
    multiLineString.geometry.data,
    [100, 0, 101, 1, 102, 2, 103, 3],
    'flat MultiLineString data should be equivalent'
  );
  t.deepEquals(
    multiLineString.geometry.indices,
    [0, 4],
    'flat MultiLineString indices should be equivalent'
  );

  // Polygon
  t.deepEquals(
    polygon.geometry.data,
    [100, 0, 101, 0, 101, 1, 100, 1, 100, 0],
    'flat Polygon data should be equivalent'
  );
  t.deepEquals(polygon.geometry.indices, [[0]], 'flat Polygon indices should be equivalent');
  t.deepEquals(polygon.geometry.areas, [[-1]], 'flat Polygon areas should be equivalent');

  // Polygon (hole)
  t.deepEquals(
    polygonWithHole.geometry.data,
    [
      100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2, 100.2, 0.8, 100.8,
      0.8
    ],
    'flat Polygon (hole) data should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.indices,
    [[0, 10]],
    'flat Polygon (hole) indices should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.areas,
    [[-1, 0.3599999999999966]],
    'flat Polygon (hole) areas should be equivalent'
  );

  // MultiPolygon
  t.deepEquals(
    multiPolygon.geometry.data,
    [
      102, 2, 103, 2, 103, 3, 102, 3, 102, 2, 100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.2, 0.2,
      100.2, 0.8, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2
    ],
    'flat MultiPolygon data should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.indices,
    [[0], [10, 20]],
    'flat MultiPolygon indices should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.areas,
    [[-1], [-1, 0.3599999999999966]],
    'flat MultiPolygon areas should be equivalent'
  );

  t.end();
});

test('gis#geojson-to-flat-geojson 3D', async (t) => {
  const response = await fetchFile(FEATURES_3D);
  const {features} = await response.json();

  const flatFeatures = geojsonToFlatGeojson(features);
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;

  // Point
  t.deepEquals(point.geometry.data, [100, 0, 1], 'flat Point data should be equivalent');
  t.deepEquals(point.geometry.indices, [0], 'flat Point indices should be equivalent');

  // MultiPoint
  t.deepEquals(
    multiPoint.geometry.data,
    [100, 0, 2, 101, 1, 3],
    'flat MultiPoint data should be equivalent'
  );
  t.deepEquals(multiPoint.geometry.indices, [0, 3], 'flat MultiPoint indices should be equivalent');

  // LineString
  t.deepEquals(
    lineString.geometry.data,
    [100, 0, 4, 101, 1, 5],
    'flat LineString data should be equivalent'
  );
  t.deepEquals(lineString.geometry.indices, [0], 'flat LineString indices should be equivalent');

  // MultiLineString
  t.deepEquals(
    multiLineString.geometry.data,
    [100, 0, 6, 101, 1, 7, 102, 2, 8, 103, 3, 9],
    'flat MultiLineString data should be equivalent'
  );
  t.deepEquals(
    multiLineString.geometry.indices,
    [0, 6],
    'flat MultiLineString indices should be equivalent'
  );

  // Polygon
  t.deepEquals(
    polygon.geometry.data,
    [100, 0, 10, 101, 0, 11, 101, 1, 12, 100, 1, 13, 100, 0, 14],
    'flat Polygon data should be equivalent'
  );
  t.deepEquals(polygon.geometry.indices, [[0]], 'flat Polygon indices should be equivalent');
  t.deepEquals(polygon.geometry.areas, [[-1]], 'flat Polygon areas should be equivalent');

  // Polygon (hole)
  t.deepEquals(
    polygonWithHole.geometry.data,
    [
      100, 0, 15, 101, 0, 16, 101, 1, 17, 100, 1, 18, 100, 0, 19, 100.8, 0.8, 20, 100.8, 0.2, 21,
      100.2, 0.2, 22, 100.2, 0.8, 23, 100.8, 0.8, 24
    ],
    'flat Polygon (hole) data should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.indices,
    [[0, 15]],
    'flat Polygon (hole) indices should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.areas,
    [[-1, 0.3599999999999966]],
    'flat Polygon (hole) areas should be equivalent'
  );

  // MultiPolygon
  t.deepEquals(
    multiPolygon.geometry.data,
    [
      102, 2, 25, 103, 2, 26, 103, 3, 27, 102, 3, 28, 102, 2, 29, 100, 0, 30, 101, 0, 31, 101, 1,
      32, 100, 1, 33, 100, 0, 34, 100.2, 0.2, 35, 100.2, 0.8, 36, 100.8, 0.8, 37, 100.8, 0.2, 38,
      100.2, 0.2, 39
    ],
    'flat MultiPolygon data should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.indices,
    [[0], [15, 30]],
    'flat MultiPolygon indices should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.areas,
    [[-1], [-1, 0.3599999999999966]],
    'flat MultiPolygon areas should be equivalent'
  );

  t.end();
});

test('gis#geojson-to-flat-geojson Mixed', async (t) => {
  const response = await fetchFile(FEATURES_MIXED);
  const {features} = await response.json();

  const flatFeatures = geojsonToFlatGeojson(features, {coordLength: 3});
  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;

  // Point
  t.deepEquals(point.geometry.data, [100, 0, 1], 'flat Point data should be equivalent');
  t.deepEquals(point.geometry.indices, [0], 'flat Point indices should be equivalent');

  // MultiPoint
  t.deepEquals(
    multiPoint.geometry.data,
    [100, 0, 0, 101, 1, 0],
    'flat MultiPoint data should be equivalent'
  );
  t.deepEquals(multiPoint.geometry.indices, [0, 3], 'flat MultiPoint indices should be equivalent');

  // LineString
  t.deepEquals(
    lineString.geometry.data,
    [100, 0, 0, 101, 1, 0],
    'flat LineString data should be equivalent'
  );
  t.deepEquals(lineString.geometry.indices, [0], 'flat LineString indices should be equivalent');

  // MultiLineString
  t.deepEquals(
    multiLineString.geometry.data,
    [100, 0, 2, 101, 1, 0, 102, 2, 0, 103, 3, 0],
    'flat MultiLineString data should be equivalent'
  );
  t.deepEquals(
    multiLineString.geometry.indices,
    [0, 6],
    'flat MultiLineString indices should be equivalent'
  );

  // Polygon
  t.deepEquals(
    polygon.geometry.data,
    [100, 0, 0, 101, 0, 0, 101, 1, 0, 100, 1, 0, 100, 0, 3],
    'flat Polygon data should be equivalent'
  );
  t.deepEquals(polygon.geometry.indices, [[0]], 'flat Polygon indices should be equivalent');
  t.deepEquals(polygon.geometry.areas, [[-1]], 'flat Polygon areas should be equivalent');

  // Polygon (hole)
  t.deepEquals(
    polygonWithHole.geometry.data,
    [
      100, 0, 0, 101, 0, 0, 101, 1, 0, 100, 1, 0, 100, 0, 0, 100.8, 0.8, 0, 100.8, 0.2, 0, 100.2,
      0.2, 0, 100.2, 0.8, 0, 100.8, 0.8, 0
    ],
    'flat Polygon (hole) data should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.indices,
    [[0, 15]],
    'flat Polygon (hole) indices should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.areas,
    [[-1, 0.3599999999999966]],
    'flat Polygon (hole) areas should be equivalent'
  );

  // MultiPolygon
  t.deepEquals(
    multiPolygon.geometry.data,
    [
      102, 2, 0, 103, 2, 0, 103, 3, 0, 102, 3, 0, 102, 2, 0, 100, 0, 0, 101, 0, 0, 101, 1, 0, 100,
      1, 0, 100, 0, 0, 100.2, 0.2, 0, 100.2, 0.8, 0, 100.8, 0.8, 0, 100.8, 0.2, 0, 100.2, 0.2, 0
    ],
    'flat MultiPolygon data should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.indices,
    [[0], [15, 30]],
    'flat MultiPolygon indices should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.areas,
    [[-1], [-1, 0.3599999999999966]],
    'flat MultiPolygon areas should be equivalent'
  );

  t.end();
});

// eslint-disable-next-line max-statements
test('gis#geojson-to-flat-geojson winding', async (t) => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();
  const polygons = features.slice(4);

  // Manually reverse winding for all shapes
  for (const {geometry} of polygons) {
    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((shape) => shape.reverse());
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((g) => {
        g.forEach((shape) => shape.reverse());
      });
    }
  }

  let flatFeatures = geojsonToFlatGeojson(JSON.parse(JSON.stringify(polygons)), {
    fixRingWinding: true
  });
  let [polygon, polygonWithHole, multiPolygon] = flatFeatures;

  // Polygon
  t.deepEquals(
    polygon.geometry.data,
    [100, 0, 101, 0, 101, 1, 100, 1, 100, 0],
    'flat Polygon data should be equivalent'
  );
  t.deepEquals(polygon.geometry.indices, [[0]], 'flat Polygon indices should be equivalent');
  t.deepEquals(polygon.geometry.areas, [[-1]], 'flat Polygon areas should be equivalent');

  // Polygon (hole)
  t.deepEquals(
    polygonWithHole.geometry.data,
    [
      100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2, 100.2, 0.8, 100.8,
      0.8
    ],
    'flat Polygon (hole) data should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.indices,
    [[0, 10]],
    'flat Polygon (hole) indices should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.areas,
    [[-1, 0.3599999999999966]],
    'flat Polygon (hole) areas should be equivalent'
  );

  // MultiPolygon
  t.deepEquals(
    multiPolygon.geometry.data,
    [
      102, 2, 103, 2, 103, 3, 102, 3, 102, 2, 100, 0, 101, 0, 101, 1, 100, 1, 100, 0, 100.2, 0.2,
      100.2, 0.8, 100.8, 0.8, 100.8, 0.2, 100.2, 0.2
    ],
    'flat MultiPolygon data should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.indices,
    [[0], [10, 20]],
    'flat MultiPolygon indices should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.areas,
    [[-1], [-1, 0.3599999999999966]],
    'flat MultiPolygon areas should be equivalent'
  );

  // Repeat tests without ring winding fix
  flatFeatures = geojsonToFlatGeojson(polygons, {fixRingWinding: false});
  [polygon, polygonWithHole, multiPolygon] = flatFeatures;

  // Polygon
  t.deepEquals(
    polygon.geometry.data,
    [100, 0, 100, 1, 101, 1, 101, 0, 100, 0],
    'flat Polygon data should be reversed'
  );
  t.deepEquals(polygon.geometry.indices, [[0]], 'flat Polygon indices should be equivalent');
  t.deepEquals(polygon.geometry.areas, [[1]], 'flat Polygon areas should be negated');

  // Polygon (hole)
  t.deepEquals(
    polygonWithHole.geometry.data,
    [
      100, 0, 100, 1, 101, 1, 101, 0, 100, 0, 100.8, 0.8, 100.2, 0.8, 100.2, 0.2, 100.8, 0.2, 100.8,
      0.8
    ],
    'flat Polygon (hole) data should be reversed'
  );
  t.deepEquals(
    polygonWithHole.geometry.indices,
    [[0, 10]],
    'flat Polygon (hole) indices should be equivalent'
  );
  t.deepEquals(
    polygonWithHole.geometry.areas,
    [[1, -0.3599999999999966]],
    'flat Polygon (hole) areas should be negated'
  );

  // MultiPolygon
  t.deepEquals(
    multiPolygon.geometry.data,
    [
      102, 2, 102, 3, 103, 3, 103, 2, 102, 2, 100, 0, 100, 1, 101, 1, 101, 0, 100, 0, 100.2, 0.2,
      100.8, 0.2, 100.8, 0.8, 100.2, 0.8, 100.2, 0.2
    ],
    'flat MultiPolygon data should be reversed'
  );
  t.deepEquals(
    multiPolygon.geometry.indices,
    [[0], [10, 20]],
    'flat MultiPolygon indices should be equivalent'
  );
  t.deepEquals(
    multiPolygon.geometry.areas,
    [[1], [1, -0.3599999999999966]],
    'flat MultiPolygon areas should be negated'
  );

  t.end();
});

test('gis#geojson-to-flat-geojson invalid type', async (t) => {
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

  t.throws(() => geojsonToFlatGeojson(features), 'throws when type is GeometryCollection');

  features[0].geometry.type = 'Invalid';
  t.throws(() => geojsonToFlatGeojson(features), 'throws when type is Invalid');
});
