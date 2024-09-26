// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

// loaders.gl sources and loaders
import {createDataSource, DataSource} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {MVTSource, TableTileSource} from '@loaders.gl/mvt';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';

test.only('createDataSource', async (t) => {
  const dataSource = createDataSource(url, [PMTilesSource, TableTileSource, MVTSource], {
    pmtiles: {
      attributions: example.attributions,
      // Make the Schema more presentable by limiting the number of values per column the field metadata
      loadOptions: {tilejson: {maxValues: 10}}
    },
    table: {
      generateId: true,
      loaders: [GeoJSONLoader]
    },
    mvt: {}
  });

  t.deepEquals(values, [1, 2], 'parseInBatches returned data');
  t.ok(dataSource instanceof DataSource, 'metadata batch was generated');

  t.end();
});
