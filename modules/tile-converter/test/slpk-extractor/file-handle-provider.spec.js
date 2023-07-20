import test from 'tape-promise/tape';
import {signature} from '../../../i3s/src/lib/parsers/parse-zip/local-file-header';
import {FileHandleProvider} from '@loaders.gl/tile-converter';
import {isBrowser} from '@loaders.gl/core';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('FileHandleProvider#slice', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleProvider.from(SLPKUrl);
    t.equals(Buffer.from(await provider.slice(0n, 4n)).compare(signature), 0);
  }
  t.end();
});

test('FileHandleProvider#getUint8', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleProvider.from(SLPKUrl);
    t.equals(await provider.getUint8(0n), 80);
    t.end();
  }
  t.end();
});

test('FileHandleProvider#local file header parse', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleProvider.from(SLPKUrl);
    t.equals(await provider.getUint16(0n), 19280);
  }
  t.end();
});

test('FileHandleProvider#local file header parse', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleProvider.from(SLPKUrl);
    t.equals(await provider.getUint32(0n), 67324752);
  }
  t.end();
});

test('FileHandleProvider#local file header parse', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleProvider.from(SLPKUrl);
    t.equals(await provider.getBigUint64(0n), 67324752n);
  }
  t.end();
});
