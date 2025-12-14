import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {BlobFile} from '@loaders.gl/loader-utils';
import {getReadableFileSize, readRange} from '@loaders.gl/zip';

test('ReadableFile#getReadableFileSize', async (t) => {
  const provider = new BlobFile(DATA_ARRAY.buffer);
  const size = await getReadableFileSize(provider);
  t.equal(size, BigInt(DATA_ARRAY.byteLength));
  t.end();
});

test('ReadableFile#read helpers', async (t) => {
  const provider = new BlobFile(DATA_ARRAY.buffer);
  t.deepEqual(
    new Uint8Array(await readRange(provider, 0n, 4n)),
    new Uint8Array(DATA_ARRAY.slice(0, 4))
  );
  t.equal(new DataView(await readRange(provider, 0n, 1n)).getUint8(0), DATA_ARRAY[0]);
  t.end();
});
