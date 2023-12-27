import test from 'tape-promise/tape';
import {composeHashFile} from '../../src/hash-file-utility';
import {FileHandleFile} from '@loaders.gl/loader-utils';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('zip#composeHashFile', async (t) => {
  t.equal((await composeHashFile(new FileHandleFile(SLPKUrl))).byteLength, 6888);
});
