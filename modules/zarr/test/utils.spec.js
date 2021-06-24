import test from 'tape-promise/tape';

import {isInterleaved, getIndexer} from '@loaders.gl/zarr/lib/utils';

test('isInterleaved', (t) => {
  t.plan(4);
  t.ok(isInterleaved([1, 2, 400, 400, 4]));
  t.ok(isInterleaved([1, 2, 400, 400, 3]));
  t.ok(!isInterleaved([1, 2, 400, 400]));
  t.ok(!isInterleaved([1, 3, 4, 4000000]));
});

test('Indexer creation and usage.', (t) => {
  t.plan(4);
  const labels = ['a', 'b', 'y', 'x'];
  const indexer = getIndexer(labels);
  t.deepEqual(indexer({a: 10, b: 20}), [10, 20, 0, 0], 'should allow named indexing.');
  t.deepEqual(indexer([10, 20, 0, 0]), [10, 20, 0, 0], 'allows array like indexing.');
  t.throws(() => indexer({c: 0, b: 0}), 'should throw with invalid dim name.');
  t.throws(() => getIndexer(['a', 'b', 'c', 'b', 'y', 'x']), 'no duplicated labels names.');
});
