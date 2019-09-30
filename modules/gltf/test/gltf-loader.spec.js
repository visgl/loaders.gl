/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {registerLoaders, load, parseSync, fetchFile} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';
import {ImageLoader} from '@loaders.gl/images';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLTF_JSON_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.gltf';

// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';
const GLB_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';
const GLB_TILE_URL = '@loaders.gl/gltf/test/data/3d-tiles/tile.glb';

test('GLTFLoader#loader conformance', t => {
  validateLoader(t, GLTFLoader, 'GLTFLoader');
  t.end();
});

test('GLTFLoader#parseSync()', async t => {
  const response = await fetchFile(GLTF_JSON_URL);
  const data = await response.text();

  t.throws(() => parseSync(data, GLTFLoader), 'GLTFLoader throws when synchronously parsing gltfs');

  t.end();
});

test('GLTFLoader#load(binary)', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#load(text)', async t => {
  const data = await load(GLTF_JSON_URL, GLTFLoader, {gltf: {loadImages: false}});
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#load(3d tile GLB)', async t => {
  t.ok(await load(GLB_TILE_URL, [GLTFLoader, DracoLoader]), `Test that GLB from 3D tile parses`);

  t.ok(
    await load(GLB_TILE_WITH_DRACO_URL, [GLTFLoader, DracoLoader, ImageLoader]),
    `Parses Draco GLB with supplied DracoLoader`
  );

  // TODO - prone to flakiness since we have async unregisterLoaders calls
  registerLoaders([DracoLoader, ImageLoader]);

  t.ok(
    await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader),
    `Parses Draco GLB with registered DracoLoader`
  );

  t.rejects(
    async () => await load(GLB_TILE_CESIUM_AIR_URL, GLTFLoader),
    /Invalid GLB version 1/,
    `GLB v1 is rejected with a user-friendly message`
  );
});
