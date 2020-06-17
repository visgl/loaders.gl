import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {SHPLoader} from '@loaders.gl/shapefile';

const SHAPEFILE_POLYGON_PATH = '@loaders.gl/shapefile/test/data/shapefile-js/polygons.shp';

test('SHPLoader#load polygons', async t => {
  const result = await load(SHAPEFILE_POLYGON_PATH, SHPLoader);

  t.ok(result.header, 'A header received');
  t.equal(result.geometries.length, 3, 'Correct number of rows received');
  t.end();
});
