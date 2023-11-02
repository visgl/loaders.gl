import test from 'tape-promise/tape';
import {localHeaderSignature as signature} from '@loaders.gl/zip';
import {isBrowser} from '@loaders.gl/core';

import {FileHandleFile} from '@loaders.gl/loader-utils';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('FileHandleFile#slice', async (t) => {
  if (!isBrowser) {
    const provider = new FileHandleFile(SLPKUrl);
    const slice = await provider.slice(0n, 4n);
    t.equals(new Uint8Array(slice), signature);
  }
  t.end();
});

test('FileHandleFile#getUint8', async (t) => {
  if (!isBrowser) {
    const provider = new FileHandleFile(SLPKUrl);
    t.equals(await provider.getUint8(0n), 80);
    t.end();
  }
  t.end();
});

test('FileHandleFile#getUint16', async (t) => {
  if (!isBrowser) {
    const provider = new FileHandleFile(SLPKUrl);
    t.equals(await provider.getUint16(0n), 19280);
  }
  t.end();
});

test('FileHandleFile#getUint32', async (t) => {
  if (!isBrowser) {
    const provider = new FileHandleFile(SLPKUrl);
    t.equals(await provider.getUint32(0n), 67324752);
  }
  t.end();
});

test('FileHandleFile#getBigUint64', async (t) => {
  if (!isBrowser) {
    const provider = new FileHandleFile(SLPKUrl);
    t.equals(await provider.getBigUint64(0n), 193340853072n);
  }
  t.end();
});
