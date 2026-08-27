import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {getGeoarrowVertexCount} from '@loaders.gl/geoarrow';
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
