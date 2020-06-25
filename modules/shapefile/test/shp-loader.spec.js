import test from 'tape-promise/tape';
import {loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {SHPLoader} from '@loaders.gl/shapefile';

const SHAPEFILE_POLYGON_PATH = '@loaders.gl/shapefile/test/data/shapefile-js/polygons.shp';

test('SHPLoader#loadInBatches polygons', async t => {
  const iterator = await loadInBatches(SHAPEFILE_POLYGON_PATH, SHPLoader);
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.features.length;
  }

  t.equal(batchCount, 1, 'Correct number of batches received');
  t.equal(rowCount, 3, 'Correct number of row received');
  t.end();
});
