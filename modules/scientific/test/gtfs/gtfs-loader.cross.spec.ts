// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ZipWriter} from '@loaders.gl/archives/zip/bundled';
import {parse} from '@loaders.gl/core';
import {GTFSLoader} from '@loaders.gl/scientific/gtfs';
import {expect, test} from 'vitest';

test('GTFS Schedule metadata preloads the ZIP and stop parser', async () => {
  const archive = await ZipWriter.encode({
    'stops.txt': 'stop_id,stop_lat,stop_lon\n001,42.5,-71.125'
  });
  const feed = await parse(archive, GTFSLoader);
  expect(feed).toMatchObject({
    tables: {
      stops: {
        shape: 'object-row-table',
        data: [{stop_id: '001', stop_lat: 42.5, stop_lon: -71.125}]
      }
    },
    stops: {
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [-71.125, 42.5]},
          properties: {stop_id: '001'}
        }
      ]
    }
  });
});
