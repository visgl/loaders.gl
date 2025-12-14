import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {BlobFile, isBrowser} from '@loaders.gl/loader-utils';
import {readRange} from '@loaders.gl/zip';

// TODO - try harder to avoid use of Node.js Buffer
export const getSignature = () => new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

// TODO remove browser exclude when BlobFile no longer uses buffer
if (!isBrowser) {
  test('BlobFile#slice', async (t) => {
    const provider = new BlobFile(DATA_ARRAY.buffer);
    const slice = await readRange(provider, 0n, 4n);
    t.deepEqual(new Uint8Array(slice), getSignature());
    t.end();
  });

  test('BlobFile#readUint8', async (t) => {
    const provider = new BlobFile(DATA_ARRAY.buffer);
    const slice = await readRange(provider, 0n, 1n);
    t.equals(new DataView(slice).getUint8(0), 80);
    t.end();
  });

  test('BlobFile#readUint16', async (t) => {
    const provider = new BlobFile(DATA_ARRAY.buffer);
    const slice = await readRange(provider, 0n, 2n);
    t.equals(new DataView(slice).getUint16(0, true), 19280);
    t.end();
  });

  test('BlobFile#readUint32', async (t) => {
    const provider = new BlobFile(DATA_ARRAY.buffer);
    const slice = await readRange(provider, 0n, 4n);
    t.equals(new DataView(slice).getUint32(0, true), 67324752);
    t.end();
  });

  test('BlobFile#readBigUint64', async (t) => {
    const provider = new BlobFile(DATA_ARRAY.buffer);
    const slice = await readRange(provider, 0n, 8n);
    t.equals(new DataView(slice).getBigUint64(0, true), 563035920091984n);
    t.end();
  });
}
