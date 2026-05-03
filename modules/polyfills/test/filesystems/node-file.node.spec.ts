import {expect, test} from 'vitest';
import {NodeFile} from '@loaders.gl/loader-utils';
const SLPK_URL = 'modules/i3s/test/data/DA12_subset.slpk';
const TEST_OFFSET = 100n;
const getSize = async (provider: NodeFile): Promise<bigint> => {
  const stat = await provider.stat();
  return stat.bigsize;
};
test('NodeFile#open and read', async () => {
  const provider = new NodeFile(SLPK_URL);
  const arrayBuffer = await provider.read(4, 1);
  const reference = Buffer.from(new Uint8Array([0x2d]));
  expect(reference.compare(Buffer.from(arrayBuffer))).toBe(0);
});
test('NodeFile#truncate and append', async () => {
  const provider = new NodeFile(SLPK_URL, 'a+');
  const initialSize = await getSize(provider);
  const ending = await provider.read(TEST_OFFSET, Number(initialSize - TEST_OFFSET));
  await provider.truncate(Number(TEST_OFFSET));
  expect(await getSize(provider)).toBe(TEST_OFFSET);
  await provider.append(new Uint8Array(ending));
  expect(await getSize(provider)).toBe(initialSize);
});
