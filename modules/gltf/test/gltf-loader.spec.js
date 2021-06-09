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
const GLB_V1_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';
const GLB_TILE_URL = '@loaders.gl/gltf/test/data/3d-tiles/tile.glb';

test('GLTFLoader#loader conformance', (t) => {
  validateLoader(t, GLTFLoader, 'GLTFLoader');
  t.end();
});

test('GLTFLoader#parseSync()', async (t) => {
  const response = await fetchFile(GLTF_JSON_URL);
  const data = await response.text();

  t.throws(() => parseSync(data, GLTFLoader), 'GLTFLoader throws when synchronously parsing gltfs');

  t.end();
});

test('GLTFLoader#load(binary)', async (t) => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  t.ok(data.asset, 'GLTFLoader returned parsed data');

  t.end();
});

test('GLTFLoader#load(binary) - postProcess: false', async (t) => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {postProcess: false}});
  t.ok(data._glb, 'GLTFLoader without post-processing returned data._glb');
  t.ok(data.buffers, 'GLTFLoader without post-processing returned data.buffers');
  t.ok(data.images, 'GLTFLoader without post-processing returned data.images');
  t.ok(data.json, 'GLTFLoader without post-processing returned data.json');
  t.end();
});

test('GLTFLoader#load(text)', async (t) => {
  const data = await load(GLTF_JSON_URL, GLTFLoader, {gltf: {loadImages: false}});
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#load(3d tile GLB)', async (t) => {
  t.ok(await load(GLB_TILE_URL, [GLTFLoader, DracoLoader]), `Test that GLB from 3D tile parses`);

  t.ok(
    await load(GLB_TILE_WITH_DRACO_URL, [GLTFLoader, DracoLoader, ImageLoader]),
    `Parses Draco GLB with supplied DracoLoader`
  );

  // TODO - prone to flakiness since we have async unregisterLoaders calls
  registerLoaders([DracoLoader, ImageLoader]);

  const gltf2 = await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader);
  t.ok(gltf2, `Parses Draco GLB with defaultregistered DracoLoader`);

  t.end();
});

test('GLTFLoader#load(glTF v1)', async (t) => {
  await t.rejects(
    load(GLB_V1_TILE_CESIUM_AIR_URL, GLTFLoader, {gltf: {normalize: false}}),
    /glTF v1 is not supported/,
    'glTF v1 generates error message'
  );

  const gltf1 = await load(GLB_V1_TILE_CESIUM_AIR_URL, GLTFLoader, {gltf: {normalize: true}});
  t.ok(gltf1, `glTF v1 was normalized without errors`);

  t.end();
});

// Check load options

test('GLTFLoader#options({postProcess: true})', async (t) => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {
    gltf: {postProcess: true}
  });
  const value = data.meshes[0].primitives[0].attributes.POSITION.value;
  t.ok(
    ArrayBuffer.isView(value),
    'GLTFLoader({postProcess: true}) resolves accessor value as typed array'
  );
  t.equal(value.length, 6036, 'GLTFLoader({postProcess: true}) resolves accessor value length');
  t.end();
});
