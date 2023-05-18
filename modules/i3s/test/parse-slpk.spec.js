import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {SLPKLoader} from '../src';

test('SLPKLoader#slpk load', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {path: 'nodepages/0.json'});
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});

test('SLPKLoader#slpk load error', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  try {
    await load(SLPKUrl, SLPKLoader, {path: 'nodepages/5.json'});
    t.fail('error should be thrown');
  } catch (e) {
    if (e) t.pass('correct error thrown');
  }
  t.end();
});

test('SLPKLoader#slpk load http nodepage', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    path: 'layers/0/nodepages/0',
    pathMode: 'http'
  });
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});

test('SLPKLoader#slpk load http layer', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {path: 'layers/0', pathMode: 'http'});
  t.deepEqual(uncompressedFile.byteLength, 4780);
  t.end();
});

test('SLPKLoader#slpk load http node', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    path: 'layers/0/nodes/0',
    pathMode: 'http'
  });
  t.deepEqual(uncompressedFile.byteLength, 1171);
  t.end();
});

test('SLPKLoader#slpk load http geometry', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    path: 'layers/0/nodes/0/geometries/0',
    pathMode: 'http'
  });
  t.deepEqual(uncompressedFile.byteLength, 156280);
  t.end();
});

test('SLPKLoader#slpk load http attributes', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    path: 'layers/0/nodes/2/attributes/f_2/0',
    pathMode: 'http'
  });
  t.deepEqual(uncompressedFile.byteLength, 8);
  t.end();
});

test('SLPKLoader#slpk load http statistics', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    path: 'layers/0/statistics/f_3/0',
    pathMode: 'http'
  });
  t.deepEqual(uncompressedFile.byteLength, 735);
  t.end();
});

test('SLPKLoader#slpk load http shared', async (t) => {
  const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    path: 'layers/0/nodes/2/shared',
    pathMode: 'http'
  });
  t.deepEqual(uncompressedFile.byteLength, 333);
  t.end();
});
