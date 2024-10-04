// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {encodeTextSync} from '@loaders.gl/core';
import {WKTWriter} from '@loaders.gl/wkt';

test('encodeWKT', (t) => {
  t.throws(
    () => encodeTextSync({type: 'FeatureCollection'}, WKTWriter),
    'does not accept featurecollections'
  );

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

  t.equal(
    encodeTextSync(
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [42, 20]
        }
      },
      WKTWriter
    ),
    'POINT (42 20)',
    'point equal'
  );

  t.end();
});
