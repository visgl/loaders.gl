// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2023 Foursquare Labs, Inc.

import {makeTestTable, makeTestTableFromSchemaAndColumns} from './table-utils';

export const emptyTable = makeTestTable([]);

export const tableWithData = makeTestTable([
  [{name: 'id', type: 'utf8'}, ['a', 'b', 'c']],
  [{name: 'val', type: 'float64'}, [1, 2, 3]],
  [{name: 'lat', type: 'float64'}, [10.1, 20.2, 30.3]],
  [{name: 'lng', type: 'float64'}, [-10.1, -20.2, -30.3]]
]);

const COLUMNS = [
  [
    JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    }),
    JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          [2, 2],
          [3, 3]
        ]
      }
    })
  ],
  [100, 200],
  [true, false],
  ['tableville', 'row city']
];

export const tableWithGeometryColumn = makeTestTableFromSchemaAndColumns({
  schema: {
    fields: [
      {name: 'geometry', type: 'utf8'},
      {name: 'population', type: 'float64'},
      {name: 'growing', type: 'bool'},
      {name: 'city', type: 'utf8'}
    ],
    metadata: {}
  },
  columns: COLUMNS
});

const NULL_GEO_COLUMNS = [
  [...COLUMNS[0], null],
  [100, 200, 0],
  [true, false, false],
  ['tableville', 'row city', 'nulltown']
];

export const tableWithNullGeometryColumn = makeTestTableFromSchemaAndColumns({
  schema: {
    fields: [
      {name: 'geometry', type: 'utf8'},
      {name: 'population', type: 'float64'},
      {name: 'growing', type: 'bool'},
      {name: 'city', type: 'utf8'}
    ],
    metadata: {}
  },
  columns: NULL_GEO_COLUMNS
});
