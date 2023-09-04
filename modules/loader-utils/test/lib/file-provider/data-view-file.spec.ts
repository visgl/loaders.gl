import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {DataViewFile} from '@loaders.gl/loader-utils';

// TODO - try hard to avoid use of Node.js Buffer
export const signature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

test('DataViewFile#slice', async (t) => {
  const provider = new DataViewFile(new DataView(DATA_ARRAY.buffer));
  t.equals(Buffer.from(await provider.slice(0n, 4n)).compare(signature), 0);
  t.end();
});

test('DataViewFile#getUint8', async (t) => {
  const provider = new DataViewFile(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getUint8(0n), 80);
  t.end();
});

test('DataViewFile#getUint16', async (t) => {
  const provider = new DataViewFile(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getUint16(0n), 19280);
  t.end();
});

test('DataViewFile#getUint32', async (t) => {
  const provider = new DataViewFile(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getUint32(0n), 67324752);
  t.end();
});

test('DataViewFile#getBigUint64', async (t) => {
  const provider = new DataViewFile(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getBigUint64(0n), 563035920091984n);
  t.end();
});
