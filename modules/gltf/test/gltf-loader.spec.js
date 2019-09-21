/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {registerLoaders, load, parseSync, fetchFile} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLTF_JSON_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.gltf';

// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';
const GLB_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';
const GLB_TILE_URL = '@loaders.gl/gltf/test/data/3d-tiles/tile.glb';

registerLoaders([DracoLoader]);

test('GLTFLoader#loader conformance', t => {
  validateLoader(t, GLTFLoader, 'GLTFLoader');
  t.end();
});

// V2 parser

test('GLTFLoader#parseSync(text/JSON)', async t => {
  const response = await fetchFile(GLTF_JSON_URL);
  const data = await response.text();

  t.throws(
    () => parseSync(data, GLTFLoader, {gltf: {parserVersion: 2}}),
    'GLTFLoader throws when synchronously parsing gltfs with base64 buffers'
  );

  t.end();
});

test('GLTFLoader#parseSync(binary)', async t => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();

  const gltf = parseSync(data, GLTFLoader, {gltf: {parserVersion: 2}});
  t.ok(gltf, 'GLTFLoader returned parsed data');

  t.end();
});

test('GLTFLoader#load(binary)', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {parserVersion: 2}});
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#load(text)', async t => {
  const data = await load(GLTF_JSON_URL, GLTFLoader, {gltf: {parserVersion: 2}});
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

// V1 parser (deprecated)

test('GLTFLoader#parseSync(text/JSON) V1', async t => {
  const response = await fetchFile(GLTF_JSON_URL);
  const data = await response.text();

  const gltf = parseSync(data, GLTFLoader);
  t.ok(gltf, 'GLTFLoader returned parsed data');

  t.end();
});

test('GLTFLoader#parseSync(binary) V1', async t => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();

  const gltf = parseSync(data, GLTFLoader);
  t.ok(gltf, 'GLTFLoader returned parsed data');

  t.end();
});

test('GLTFLoader#load(binary) V1', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#load(text) V1', async t => {
  const data = await load(GLTF_JSON_URL, GLTFLoader);
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#Parses GLBs from 3D Tiles', async t => {
  await testTileGLBs(t, {gltf: {parserVersion: 1}, decompress: true, DracoLoader}, 'v1');
  await testTileGLBs(t, {gltf: {parserVersion: 2}}, 'v2');
  t.end();
});

async function testTileGLBs(t, loaderOptions, version) {
  t.ok(await load(GLB_TILE_URL, GLTFLoader, loaderOptions), `Parser ${version}: Test GLB parses`);

  t.ok(
    await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader, loaderOptions),
    `Parser ${version}: Parses Draco GLB`
  );

  t.rejects(
    async () => await load(GLB_TILE_CESIUM_AIR_URL, GLTFLoader, loaderOptions),
    /Invalid GLB version 1/,
    `Parser ${version}: GLB v1 is rejected with a user-friendly message`
  );
}
