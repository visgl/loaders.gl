/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load, parseSync, fetchFile} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLB_V1_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';

test('GLBLoader#loader conformance', (t) => {
  validateLoader(t, GLBLoader, 'GLBLoader');
  t.end();
});

test('GLBLoader#parseSync(v2)', async (t) => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const glbv2 = parseSync(data, GLBLoader);
  t.equal(glbv2.version, 2, 'GLBLoader returned correct glb version');
  t.equal(glbv2.json.asset.version, '2.0', 'GLBLoader returned correct gltf version');

  t.end();
});

test('GLBLoader#load(v2)', async (t) => {
  const glbv2 = await load(GLTF_BINARY_URL, GLBLoader);
  t.equal(glbv2.version, 2, 'GLBLoader returned correct glb version');
  t.equal(glbv2.json.asset.version, '2.0', 'GLBLoader returned correct gltf version');
  t.end();
});

test('GLBLoader#load(v1)', async (t) => {
  const glbv1 = await load(GLB_V1_TILE_CESIUM_AIR_URL, GLBLoader);
  t.equal(glbv1.version, 1, 'GLBLoader returned correct glb version');
  t.equal(glbv1.json.asset.version, '1.0', 'GLBLoader returned parsed data');
  t.end();
});
