import test from 'tape-promise/tape';

import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load, isBrowser} from '@loaders.gl/core';
import {setLoaderOptions} from '@loaders.gl/core';

const KTX_URL = '@loaders.gl/textures/test/data/test_etc1s.ktx2';
const KTX2_URL = '@loaders.gl/textures/test/data/kodim23.ktx2';
const DDS_URL = '@loaders.gl/textures/test/data/shannon-dxt5.dds';
const PVR_URL = '@loaders.gl/textures/test/data/shannon-etc1.pvr';

setLoaderOptions({
  _workerType: 'test'
});

test('CompressedTextureLoader#imports', (t) => {
  t.ok(CompressedTextureLoader, 'CompressedTextureLoader defined');
  t.end();
});

test('CompressedTextureLoader#KTX', async (t) => {
  const texture = await load(KTX_URL, CompressedTextureLoader);
  t.ok(texture, 'KTX container loaded OK');
  t.end();
});

test('CompressedTextureLoader#KTX2 with BasisLoader', async (t) => {
  // Browser tests can't load module from https://raw.githubusercontent.com/BinomialLLC/basis_universal/master/webgl/encoder/build/basis_encoder.wasm
  // The test should work in browser as soon as encoder_module.wasm is published on npm
  if (!isBrowser) {
    const texture = await load(KTX2_URL, CompressedTextureLoader, {
      'compressed-texture': {useBasis: true}
    });
    t.ok(texture, 'KTX2 container loaded OK');
  }
  t.end();
});

test('CompressedTextureLoader#DDS', async (t) => {
  const texture = await load(DDS_URL, CompressedTextureLoader);
  t.ok(texture, 'DDS container loaded OK');
  t.end();
});

test('CompressedTextureLoader#PVR', async (t) => {
  const texture = await load(PVR_URL, CompressedTextureLoader);
  t.ok(texture, 'PVR container loaded OK');
  t.end();
});
