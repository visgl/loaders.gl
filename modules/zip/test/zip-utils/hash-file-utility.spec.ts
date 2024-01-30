import test from 'tape-promise/tape';
import {composeHashFile} from '../../src/hash-file-utility';
import {FileHandleFile} from '@loaders.gl/loader-utils';
import {makeZipCDHeaderIterator} from '../../src/parse-zip/cd-file-header';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('zip#composeHashFile', async (t) => {
  t.equal(
    (await composeHashFile(makeZipCDHeaderIterator(new FileHandleFile(SLPKUrl)))).byteLength,
    6888
  );
});
