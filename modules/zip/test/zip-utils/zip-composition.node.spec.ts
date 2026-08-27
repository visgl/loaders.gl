// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {copyFile, stat, unlink} from 'node:fs/promises';
import '@loaders.gl/polyfills';
import {addOneFile, createZip, getFileIterator} from '../../src/parse-zip/zip-composition';
import {expect, test} from 'vitest';
const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';
const SLPKCopyUrl = 'modules/i3s/test/data/DA12_subset1.slpk';
const folderToZip = 'modules/zip/test/data/test-folder';
const zipUrl = 'modules/zip/test/data/test-folder.zip';
test('zip#addOneFile', async () => {
  await copyFile(SLPKUrl, SLPKCopyUrl);
  await addOneFile(SLPKCopyUrl, new Uint8Array(100), '@specialIndexFileHASH128@1');
  const stats = await stat(SLPKCopyUrl);
  expect(stats.size).toBe(590671);
  await unlink(SLPKCopyUrl);
});
test('zip#getFileIterator', async () => {
  const iterator = getFileIterator(folderToZip);
  expect(await iterator[Symbol.asyncIterator]().next()).toBeTruthy();
});
test('zip#createZip', async () => {
  await createZip(folderToZip, zipUrl);
  const stats = await stat(zipUrl);
  expect(stats.size).toBe(196);
  await unlink(zipUrl);
});
