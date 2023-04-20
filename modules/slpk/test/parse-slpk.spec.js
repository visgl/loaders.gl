import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {SlpkLoader} from '../src';
import LocalFileHeader from '../src/parce-slpk/local-file-header';
import {DATA_ARRAY} from './test.zip.js';
import CDFileHeader from '../src/parce-slpk/cd-file-header';

test('SlpkLoader#slpk load', async (t) => {
  const slpkUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
  const uncompressedFile = await load(slpkUrl, SlpkLoader, {path: 'nodepages/0.json'});
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});

test('SlpkLoader#local file header parce', async (t) => {
  const localFileHeader = new LocalFileHeader(0, new DataView(DATA_ARRAY.buffer));
  t.deepEqual(localFileHeader.getCompressedSize(), 39);
  t.deepEqual(localFileHeader.getFileNameLength(), 9);
  t.end();
});

test('SlpkLoader#central directory file header parce', async (t) => {
  const cdFileHeader = new CDFileHeader(78, new DataView(DATA_ARRAY.buffer));
  t.deepEqual(cdFileHeader.getCompressedSize(), 39);
  t.deepEqual(cdFileHeader.getFileNameLength(), 9);
  const textDecoder = new TextDecoder();
  t.deepEqual(textDecoder.decode(cdFileHeader.getFileName()), 'test.json');
  t.deepEqual(cdFileHeader.getLocalHeaderOffset(), 0);
  t.end();
});
