import test from 'tape-promise/tape';
import {localHeaderSignature as signature} from '@loaders.gl/zip';
import {isBrowser} from '@loaders.gl/core';

import {FileHandleFile} from '../../src/classes/file-handle-file';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('FileHandleFile#slice', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleFile.from(SLPKUrl);
    t.equals(Buffer.from(await provider.slice(0n, 4n)).compare(signature), 0);
  }
  t.end();
});

test('FileHandleFile#getUint8', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleFile.from(SLPKUrl);
    t.equals(await provider.getUint8(0n), 80);
    t.end();
  }
  t.end();
});

test('FileHandleFile#getUint16', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleFile.from(SLPKUrl);
    t.equals(await provider.getUint16(0n), 19280);
  }
  t.end();
});

test('FileHandleFile#getUint32', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleFile.from(SLPKUrl);
    t.equals(await provider.getUint32(0n), 67324752);
  }
  t.end();
});

test('FileHandleFile#getBigUint64', async (t) => {
  if (!isBrowser) {
    const provider = await FileHandleFile.from(SLPKUrl);
    t.equals(await provider.getBigUint64(0n), 193340853072n);
  }
  t.end();
});
