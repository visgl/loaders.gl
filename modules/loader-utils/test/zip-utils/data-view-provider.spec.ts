import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {DataViewFileProvider} from '../../src/parse-zip/data-view-file-provider';
import {signature} from '../../src/parse-zip/local-file-header';

test('DataViewFileProvider#slice', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  t.equals(Buffer.from(await provider.slice(0n, 4n)).compare(signature), 0);
  t.end();
});

test('DataViewFileProvider#getUint8', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getUint8(0n), 80);
  t.end();
});

test('DataViewFileProvider#getUint16', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getUint16(0n), 19280);
  t.end();
});

test('DataViewFileProvider#getUint32', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getUint32(0n), 67324752);
  t.end();
});

test('DataViewFileProvider#getBigUint64', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  t.equals(await provider.getBigUint64(0n), 563035920091984n);
  t.end();
});
