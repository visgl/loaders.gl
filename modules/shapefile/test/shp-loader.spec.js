import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {SHPLoader} from '@loaders.gl/shapefile';

const SHAPEFILE_POLYGON_PATH = '@loaders.gl/shapefile/test/data/shapefile-js/polygons.shp';

test('SHPLoader#load polygons', async t => {
  const result = await load(SHAPEFILE_POLYGON_PATH, SHPLoader);

  t.ok(result.header, 'A header received');
  t.equal(result.geometries.length, 3, 'Correct number of rows received');
  t.end();
});

test('SHPLoader#loadInBatches polygons', async t => {
  const iterator = await loadInBatches(SHAPEFILE_POLYGON_PATH, SHPLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    batchCount++;
    t.equal(batch.type, 'Polygon', 'Correct number of rows received');
  }

  t.equal(batchCount, 1, 'Correct number of batches received');
  t.end();
});
