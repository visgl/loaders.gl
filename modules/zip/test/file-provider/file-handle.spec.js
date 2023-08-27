import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {FileHandle} from '../../src/file-provider/file-handle';
import {promises as fsPromises} from 'fs';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('FileHandle#open and read', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandle.open(SLPKUrl);
    const fsHandler = await fsPromises.open(SLPKUrl);
    t.equals(
      (await provider.read(Buffer.alloc(4), 0, 4, 1)).buffer.compare(
        (await fsHandler.read(Buffer.alloc(4), 0, 4, 1)).buffer
      ),
      0
    );
  }
  t.end();
});
