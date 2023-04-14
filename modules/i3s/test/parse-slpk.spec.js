import test from 'tape-promise/tape';
import {I3SLoader} from '../src/i3s-loader';
import {load} from '@loaders.gl/core';

test('I3SLoader#slpk load', async (t) => {
  const slpkUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(slpkUrl, I3SLoader, {path: 'nodepages/0.json'});
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});
