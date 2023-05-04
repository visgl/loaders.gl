import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {SLPKLoader} from '../src';

test('SLPKLoader#slpk load', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {path: 'nodepages/0.json'});
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});
