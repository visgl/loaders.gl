import {addOneFile} from '../../src/parse-zip/zip-compozition';
import test from 'tape-promise/tape';
import {copyFile, unlink, stat} from 'node:fs/promises';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';
const SLPKCopyUrl = 'modules/i3s/test/data/DA12_subset1.slpk';

test('zip#addOneFile', async (t) => {
  await copyFile(SLPKUrl, SLPKCopyUrl);
  await addOneFile(SLPKCopyUrl, new Uint8Array(100), '@specialIndexFileHASH128@1');
  const stats = await stat(SLPKCopyUrl);
  t.equal(stats.size, 590671);
  await unlink(SLPKCopyUrl);
});
