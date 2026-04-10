import test from 'tape-promise/tape';
import {composeHashFile} from '../../src/hash-file-utility';
import {NodeFile, isBrowser} from '@loaders.gl/loader-utils';
import {makeZipCDHeaderIterator} from '../../src/parse-zip/cd-file-header';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('zip#composeHashFile', async t => {
  if (isBrowser) {
    t.comment('Skipping Node.js filesystem test in browser');
    t.end();
    return;
  }
  t.equal((await composeHashFile(makeZipCDHeaderIterator(new NodeFile(SLPKUrl)))).byteLength, 6888);
});
