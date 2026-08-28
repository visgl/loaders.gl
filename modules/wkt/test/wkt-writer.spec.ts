// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {encodeTextSync} from '@loaders.gl/core';
import {WKTLoader as MetadataWKTLoader, WKTWriter} from '@loaders.gl/wkt';

test('WKTWriter', () => {
  expect(() => encodeTextSync({type: 'FeatureCollection'}, WKTWriter)).toThrow();

  // const fixtures = [
  //   'LINESTRING (30 10, 10 30, 40 40)',
  //   'POINT (1 1)',
  //   'POINT (1 1 1 1)',
  //   'LINESTRING (1 2 3, 4 5 6)',
  //   'LINESTRING (1 2 3 4, 5 6 7 8)',
  //   'POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))',
  //   'POLYGON ((35 10, 10 20, 15 40, 45 45, 35 10), (20 30, 35 35, 30 20, 20 30))',
  //   'MULTIPOINT (1 1, 2 3)',
  //   'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5), (10 10, 15 10, 15 15, 10 10)))',
  //   'MULTILINESTRING ((30 10, 10 30, 40 40), (30 10, 10 30, 40 40))',
  //   'GEOMETRYCOLLECTION (POINT (4 6), LINESTRING (4 6, 7 10))'
  // ];

  // fixtures.forEach((fix) => t.equal(fix, encodeSync(parse(fix, WKTLoader), WKTWriter), fix));
  const geojsonFeature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [42, 20]
    }
  };

  expect(encodeTextSync(geojsonFeature.geometry, WKTWriter)).toBe('POINT (42 20)');
  expect(
    encodeTextSync(
      {
        type: 'LineString',
        coordinates: [
          [0, 1],
          [2, 3]
        ]
      },
      WKTWriter
    )
  ).toBe('LINESTRING (0 1, 2 3)');
  expect(
    encodeTextSync(
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [0, 1],
            [0, 0]
          ]
        ]
      },
      WKTWriter
    )
  ).toBe('POLYGON ((0 0, 1 0, 0 1, 0 0))');
  expect(
    encodeTextSync({type: 'GeometryCollection', geometries: [geojsonFeature.geometry]}, WKTWriter)
  ).toBe('GEOMETRYCOLLECTION (POINT (42 20))');
});

test('WKT loader preloads the parser and writer supports binary output', async () => {
  const parser = await MetadataWKTLoader.preload();
  expect(parser.parseTextSync('POINT (4 5)')).toEqual({
    type: 'Point',
    coordinates: [4, 5]
  });
  const encoded = await WKTWriter.encode({type: 'Point', coordinates: [4, 5]});
  expect(new TextDecoder().decode(encoded)).toBe('POINT (4 5)');
  expect(new TextDecoder().decode(WKTWriter.encodeSync({type: 'Point', coordinates: [4, 5]}))).toBe(
    'POINT (4 5)'
  );
});
