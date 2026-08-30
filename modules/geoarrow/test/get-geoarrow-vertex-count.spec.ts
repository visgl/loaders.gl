import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  getGeoarrowVertexCount
} from '@loaders.gl/geoarrow';
import {
  convertGeometryToWKB,
  makeWKBGeometryArrowTable,
  makeWKBGeometryData,
  makeWKBGeometryField
} from '@loaders.gl/gis';
import type {Schema} from '@loaders.gl/schema';
test('geoarrow#getGeoarrowVertexCount counts WKB Data/Vector/Table vertices', () => {
  const polygonWKB = convertGeometryToWKB({
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0]
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1]
      ]
    ]
  });
  const multiPolygonWKB = convertGeometryToWKB({
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]
      ],
      [
        [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 3],
          [2, 2]
        ]
      ]
    ]
  });
  const geometryData = makeWKBGeometryData([polygonWKB, null, multiPolygonWKB]);
  const geometryVector = new arrow.Vector([geometryData]);
  const schema: Schema = {
    fields: [makeWKBGeometryField('geometry')],
    metadata: {}
  };
  const geometryTable = makeWKBGeometryArrowTable([polygonWKB, null, multiPolygonWKB], schema)
    .data as arrow.Table;
  expect(getGeoarrowVertexCount(geometryData), 'counts WKB Data vertices').toBe(20);
  expect(getGeoarrowVertexCount(geometryVector), 'counts WKB Vector vertices').toBe(20);
  expect(getGeoarrowVertexCount(geometryTable), 'counts WKB Table vertices').toBe(20);
});
test('geoarrow#getGeoarrowVertexCount skips extra WKB ordinates', () => {
  const polygonWKB = convertGeometryToWKB(
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0, 1, 7],
          [1, 0, 2, 8],
          [1, 1, 3, 9],
          [0, 0, 1, 7]
        ]
      ]
    },
    {hasZ: true, hasM: true}
  );
  const geometryData = makeWKBGeometryData([polygonWKB]);
  expect(getGeoarrowVertexCount(geometryData), 'counts XYZM WKB vertices using source points').toBe(
    4
  );
});

test('geoarrow#getGeoarrowVertexCount traverses dense unions and collections', () => {
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
        type: 'LineString',
        coordinates: [
          [0, 0],
          [3, 4]
        ]
      }
    }
  ]).data;
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');

  expect(getGeoarrowVertexCount(union)).toBe(3);

  const collectionSource = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [1, 2]},
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [3, 4]
            ]
          }
        ]
      }
    }
  ]).data;
  const collection = convertGeoArrowGeometry(collectionSource, 'geoarrow.geometrycollection');

  expect(getGeoarrowVertexCount(collection)).toBe(3);
});

test('geoarrow#getGeoarrowVertexCount counts WKT rows and empty geometries', () => {
  const data = arrow.vectorFromArray(
    ['POINT (1 2)', 'LINESTRING (0 0, 1 1)', 'GEOMETRYCOLLECTION (POINT EMPTY, POINT (3 4))', null],
    new arrow.Utf8()
  );

  expect(getGeoarrowVertexCount(data.data[0])).toBe(4);
});

test('geoarrow#getGeoarrowVertexCount accepts Arrow view storage', () => {
  const wkt = arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8View());
  const wkb = arrow.vectorFromArray(
    [new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [0, 0]}))],
    new arrow.BinaryView()
  );

  expect(getGeoarrowVertexCount(wkt.data[0])).toBe(1);
  expect(getGeoarrowVertexCount(wkb.data[0])).toBe(1);
});

test('geoarrow#getGeoarrowVertexCount treats Box extents as zero vertices', () => {
  const table = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [3, 4]}}
    ],
    {geoarrow: {encoding: 'geoarrow.box'}}
  ).data;
  const geometry = table.getChild('geometry')!;

  expect(getGeoarrowVertexCount(geometry.data[0])).toBe(0);
  expect(getGeoarrowVertexCount(table)).toBe(0);
});
