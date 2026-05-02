// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';

import {getGeoarrowVertexCount} from '@loaders.gl/geoarrow';
import {
  convertGeometryToWKB,
  makeWKBGeometryArrowTable,
  makeWKBGeometryData,
  makeWKBGeometryField
} from '@loaders.gl/gis';
import type {Schema} from '@loaders.gl/schema';

test('geoarrow#getGeoarrowVertexCount counts WKB Data/Vector/Table vertices', t => {
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

  t.equal(getGeoarrowVertexCount(geometryData), 20, 'counts WKB Data vertices');
  t.equal(getGeoarrowVertexCount(geometryVector), 20, 'counts WKB Vector vertices');
  t.equal(getGeoarrowVertexCount(geometryTable), 20, 'counts WKB Table vertices');
  t.end();
});

test('geoarrow#getGeoarrowVertexCount skips extra WKB ordinates', t => {
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

  t.equal(getGeoarrowVertexCount(geometryData), 4, 'counts XYZM WKB vertices using source points');
  t.end();
});
