// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getCachedZarrSelection} from '../src/lib/zarr-data-cache';

test('Zarr selection cache shares requests and evicts failures', async t => {
  const array = {};
  let reads = 0;
  const read = async () => {
    reads++;
    return {data: new Uint8Array([reads]), shape: [1]};
  };

  const first = getCachedZarrSelection(array, 'selection', read);
  const second = getCachedZarrSelection(array, 'selection', read);
  t.equal(first, second);
  t.deepEqual(Array.from((await first).data), [1]);
  t.equal(reads, 1);

  let failedReads = 0;
  const failingRead = async () => {
    failedReads++;
    if (failedReads === 1) throw new Error('expected failure');
    return {data: new Uint8Array([2]), shape: [1]};
  };
  await t.rejects(getCachedZarrSelection(array, 'failure', failingRead), /expected failure/);
  await getCachedZarrSelection(array, 'failure', failingRead);
  t.equal(failedReads, 2);
  t.end();
});
