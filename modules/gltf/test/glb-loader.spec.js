/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {load, parseSync, fetchFile} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';

test('GLBLoader#imports', t => {
  t.ok(GLBLoader, 'GLBLoader was imported');
  t.end();
});

test('GLBLoader#parseSync(binary)', async t => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const gltf = parseSync(data, GLBLoader);
  t.ok(gltf, 'GLBLoader returned parsed data');

  t.end();
});

test('GLBLoader#load(binary)', async t => {
  const data = await load(GLTF_BINARY_URL, GLBLoader);
  t.ok(data.json.asset, 'GLBLoader returned parsed data');
  t.end();
});
