import {expect, test} from 'vitest';
// loaders.gl sources and loaders
import {createDataSource, DataSource} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {MVTSource, TableTileSource} from '@loaders.gl/mvt';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';
test('createDataSource', async () => {
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
  expect(values, 'parseInBatches returned data').toEqual([1, 2]);
  expect(dataSource instanceof DataSource, 'metadata batch was generated').toBeTruthy();
});
