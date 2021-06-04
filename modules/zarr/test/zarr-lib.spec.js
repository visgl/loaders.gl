import {test} from 'tape-promise/tape';
import {FileSystemStore} from './common';
import {loadMultiscales} from '../src/zarr/lib/utils';
import {getIndexer} from '../src/zarr/lib/indexer';

const FIXTURE = 'tests/loaders/fixtures/bioformats-zarr';
test('Loads zarr-multiscales', async t => {
  t.plan(1);
  try {
    const store = new FileSystemStore(`${FIXTURE}/data.zarr`);
    const {data} = await loadMultiscales(store, '0');
    t.equal(data.length, 2, 'Should have two multiscale images.');
  } catch (e) {
    t.fail(e);
  }
});

test('Indexer creation and usage.', async t => {
  t.plan(4);
  const labels = ['a', 'b', 'y', 'x'];
  const indexer = getIndexer(labels);
  t.deepEqual(indexer({a: 10, b: 20}), [10, 20, 0, 0], 'should allow named indexing.');
  t.deepEqual(indexer([10, 20, 0, 0]), [10, 20, 0, 0], 'allows array like indexing.');
  t.throws(() => indexer({c: 0, b: 0}), 'should throw with invalid dim name.');
  t.throws(() => getIndexer(['a', 'b', 'c', 'b', 'y', 'x']), 'no duplicated labels names.');
});
