import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {NodeFile, resolvePath} from '@loaders.gl/loader-utils';
import {promises as fsPromises} from 'fs';

const SLPK_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';

test('NodeFile#open and read', async (t) => {
  if (!isBrowser) {
    const fsHandler = await fsPromises.open(resolvePath(SLPK_URL));
    const reference = await fsHandler.read(Buffer.alloc(4), 0, 4, 1);

    const provider = new NodeFile(SLPK_URL);
    const arrayBuffer = await provider.read(1, 4);

    t.equals(reference.buffer.compare(Buffer.from(arrayBuffer)), 0);
  }
  t.end();
});
