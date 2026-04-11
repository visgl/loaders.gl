import {addOneFile, createZip, getFileIterator} from '../../src/parse-zip/zip-composition';
import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';
const SLPKCopyUrl = 'modules/i3s/test/data/DA12_subset1.slpk';

const folderToZip = 'modules/zip/test/data/test-folder';
const zipUrl = 'modules/zip/test/data/test-folder.zip';

test('zip#addOneFile', async t => {
  if (isBrowser) {
    t.comment('Skipping Node.js filesystem test in browser');
    t.end();
    return;
  }
  const {copyFile, unlink, stat} = await getNodeFsPromises();
  await copyFile(SLPKUrl, SLPKCopyUrl);
  await addOneFile(SLPKCopyUrl, new Uint8Array(100), '@specialIndexFileHASH128@1');
  const stats = await stat(SLPKCopyUrl);
  t.equal(stats.size, 590671);
  await unlink(SLPKCopyUrl);
});

test('zip#getFileIterator', async t => {
  if (isBrowser) {
    t.comment('Skipping Node.js filesystem test in browser');
    t.end();
    return;
  }
  const iterator = getFileIterator(folderToZip);
  t.ok(await iterator[Symbol.asyncIterator]().next());
});

test('zip#createZip', async t => {
  if (isBrowser) {
    t.comment('Skipping Node.js filesystem test in browser');
    t.end();
    return;
  }
  const {unlink, stat} = await getNodeFsPromises();
  await createZip(folderToZip, zipUrl);
  const stats = await stat(zipUrl);
  t.equal(stats.size, 196);
  await unlink(zipUrl);
});

/**
 * Loads Node.js filesystem helpers only when a Node-only zip test is actually running.
 * @returns Node.js filesystem promise helpers.
 */
async function getNodeFsPromises(): Promise<typeof import('node:fs/promises')> {
  return await import('node:fs/promises');
}
