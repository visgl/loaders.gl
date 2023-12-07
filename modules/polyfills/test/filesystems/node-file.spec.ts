import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {NodeFile} from '@loaders.gl/loader-utils';

const SLPK_URL = 'modules/i3s/test/data/DA12_subset.slpk';
const TEST_OFFSET = 100n;

const getSize = async (provider: NodeFile): Promise<bigint> => {
  const stat = await provider.stat();
  return stat.bigsize;
};

test('NodeFile#open and read', async (t) => {
  if (!isBrowser) {
    const provider = new NodeFile(SLPK_URL);
    const arrayBuffer = await provider.read(4, 1);

    const reference = Buffer.from(new Uint8Array([0x2d]));
    t.equals(reference.compare(Buffer.from(arrayBuffer)), 0);
  }
  t.end();
});

test('NodeFile#truncate and append', async (t) => {
  if (!isBrowser) {
    const provider = new NodeFile(SLPK_URL, 'a+');
    const initialSize = await getSize(provider);

    const ending = await provider.read(TEST_OFFSET, Number(initialSize - TEST_OFFSET));

    await provider.truncate(Number(TEST_OFFSET));
    t.equals(await getSize(provider), TEST_OFFSET);

    await provider.append(new Uint8Array(ending));
    t.equals(await getSize(provider), initialSize);
  }
  t.end();
});
