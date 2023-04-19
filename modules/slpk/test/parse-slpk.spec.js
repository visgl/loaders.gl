import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {SlpkLoader} from '../src';

test('I3SLoader#slpk load', async (t) => {
  const slpkUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(slpkUrl, SlpkLoader, {path: 'nodepages/0.json'});
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});
