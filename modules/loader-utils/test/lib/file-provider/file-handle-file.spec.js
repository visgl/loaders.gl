import test from 'tape-promise/tape';
import {localHeaderSignature as signature, readRange} from '@loaders.gl/zip';
import {isBrowser} from '@loaders.gl/core';

import {NodeFile} from '@loaders.gl/loader-utils';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('NodeFile#read', async (t) => {
  if (!isBrowser) {
    const file = new NodeFile(SLPKUrl);
    const slice = await readRange(file, 0n, 4n);
    t.deepEqual(new Uint8Array(slice), signature);
    await file.close();
  }
  t.end();
});
