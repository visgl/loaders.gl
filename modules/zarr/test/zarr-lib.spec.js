import {test} from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {FileSystemStore} from '@loaders.gl/zarr/lib/utils/fetch-file-store';
import {loadMultiscales} from '@loaders.gl/zarr/lib/utils/zarr-utils';
import {getIndexer} from '@loaders.gl/zarr/lib/utils/indexer';

const FIXTURE = '@loaders.gl/zarr/test/data/bioformats-zarr';

test('Loads zarr-multiscales', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  const store = new FileSystemStore(`${FIXTURE}/data.zarr`);
  const {data} = await loadMultiscales(store, '0');
  t.equal(data.length, 2, 'Should have two multiscale images.');
  t.end();
});

test('Indexer creation and usage.', async (t) => {
  const labels = ['a', 'b', 'y', 'x'];
  const indexer = getIndexer(labels);
  t.deepEqual(indexer({a: 10, b: 20}), [10, 20, 0, 0], 'should allow named indexing.');
  t.deepEqual(indexer([10, 20, 0, 0]), [10, 20, 0, 0], 'allows array like indexing.');
  t.throws(() => indexer({c: 0, b: 0}), 'should throw with invalid dim name.');
  t.throws(() => getIndexer(['a', 'b', 'c', 'b', 'y', 'x']), 'no duplicated labels names.');
  t.end();
});
