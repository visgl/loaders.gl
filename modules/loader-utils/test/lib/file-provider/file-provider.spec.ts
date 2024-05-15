import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {BlobFile, FileProvider} from '@loaders.gl/loader-utils';

export const getSignature = () => new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

const getProvider = () => {
  return FileProvider.create(new BlobFile(DATA_ARRAY.buffer));
};

test('FileProvider#slice', async (t) => {
  const provider = await getProvider();
  const slice = await provider.slice(0, 4);
  t.deepEqual(new Uint8Array(slice), getSignature());
  t.end();
});

test('FileProvider#getUint8', async (t) => {
  const provider = await getProvider();
  t.equals(await provider.getUint8(0), 80);
  t.end();
});

test('FileProvider#getUint16', async (t) => {
  const provider = await getProvider();
  t.equals(await provider.getUint16(0), 19280);
  t.end();
});

test('FileProvider#getUint32', async (t) => {
  const provider = await getProvider();
  t.equals(await provider.getUint32(0), 67324752);
  t.end();
});

test('FileProvider#getBigUint64', async (t) => {
  const provider = await getProvider();
  t.equals(await provider.getBigUint64(0), 563035920091984n);
  t.end();
});
