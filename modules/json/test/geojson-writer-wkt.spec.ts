// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {encodeTableAsText} from '@loaders.gl/core';
import {GeoJSONWriter} from '@loaders.gl/json';
import type {ObjectRowTable} from '@loaders.gl/schema';

test('GeoJSONWriter auto-detects and converts a WKT geometry column', async () => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {name: 'name', type: 'utf8'},
        {name: 'location', type: 'utf8'}
      ],
      metadata: {}
    },
    data: [{name: 'origin', location: 'POINT (1 2)'}]
  };

  const encodedText = await encodeTableAsText(table, GeoJSONWriter);

  expect(JSON.parse(encodedText)).toEqual({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'origin'}
      }
    ]
  });
});
