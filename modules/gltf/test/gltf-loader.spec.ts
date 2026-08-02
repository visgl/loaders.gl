/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {registerLoaders, load, parse, parseSync, fetchFile} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF, type GLTFLoaderOptions} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';
import {ImageBitmapLoader} from '@loaders.gl/images';
import {getGLTFImageOptions} from '../src/lib/parsers/parse-gltf';
import {createGLBV3} from './test-utils/create-glb-v3';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLTF_JSON_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.gltf';
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';
const GLB_V1_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';
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
  t.ok(data.json.asset, 'GLTFLoader returned parsed data');

  t.end();
});

test('GLTFLoader#parse() loads a draft glTF 2.1 thumbnail image', async t => {
  const gltf = await parse(
    JSON.stringify({
      asset: {version: '2.1', thumbnail: 0},
      images: [{uri: PNG_DATA_URL}]
    }),
    GLTFLoader
  );

  t.ok(gltf.images?.[0], 'loads an image referenced only by asset.thumbnail');
  t.end();
});

test('GLTFLoader#parse(v3) resolves explicit buffer chunk indices', async t => {
  const data = createGLBV3(
    {
      asset: {version: '2.1'},
      buffers: [
        {byteLength: 4, chunk: 3},
        {byteLength: 4, chunk: 2}
      ]
    },
    [new Uint8Array([1, 2, 3, 4]), new Uint8Array([5, 6, 7, 8])],
    [{type: 0x54534554, data: new Uint8Array([9, 10, 11, 12])}]
  );

  const gltf = await parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}});
  const firstBuffer = new Uint8Array(
    gltf.buffers[0].arrayBuffer,
    gltf.buffers[0].byteOffset,
    gltf.buffers[0].byteLength
  );
  const secondBuffer = new Uint8Array(
    gltf.buffers[1].arrayBuffer,
    gltf.buffers[1].byteOffset,
    gltf.buffers[1].byteLength
  );

  t.deepEqual(Array.from(firstBuffer), [5, 6, 7, 8], 'resolves buffer 0 from chunk 3');
  t.deepEqual(Array.from(secondBuffer), [1, 2, 3, 4], 'resolves buffer 1 from chunk 2');
  t.end();
});

test('GLTFLoader#parse(v3) preserves legacy implicit buffer mapping', async t => {
  const data = createGLBV3({asset: {version: '2.1'}, buffers: [{byteLength: 4}]}, [
    new Uint8Array([1, 2, 3, 4])
  ]);
  const gltf = await parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}});
  const buffer = new Uint8Array(
    gltf.buffers[0].arrayBuffer,
    gltf.buffers[0].byteOffset,
    gltf.buffers[0].byteLength
  );

  t.deepEqual(Array.from(buffer), [1, 2, 3, 4], 'maps the classic JSON-then-BIN layout');
  t.end();
});

test('GLTFLoader#parse(v3) rejects implicit buffers outside the legacy layout', async t => {
  const data = createGLBV3(
    {asset: {version: '2.1'}, buffers: [{byteLength: 4}]},
    [new Uint8Array([1, 2, 3, 4])],
    [{type: 0x54534554, data: new Uint8Array([9, 10, 11, 12])}]
  );

  await t.rejects(
    parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}}),
    /buffer 0 without a uri must define a valid GLB v3 chunk/,
    'does not replace an unresolved buffer with zero-filled bytes'
  );
  t.end();
});

test('GLTFLoader#parse(v3) rejects missing buffer chunks', async t => {
  const data = createGLBV3({
    asset: {version: '2.1'},
    buffers: [{byteLength: 4, chunk: 2}]
  });

  await t.rejects(
    parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}}),
    /buffer 0 references missing GLB BIN chunk 2/,
    'rejects a chunk index that does not select a BIN chunk'
  );
  t.end();
});

test('GLTFLoader#parse(v3) loads embedded glTF 2.1 files', async t => {
  const data = createGLBV3(
    {
      asset: {version: '2.1'},
      buffers: [{byteLength: 4}],
      bufferViews: [{buffer: 0, byteLength: 4}],
      files: [{name: 'nested.glb', mimeType: 'model/gltf-binary', bufferView: 0}]
    },
    [new Uint8Array([1, 2, 3, 4])]
  );
  const gltf = await parse(data, GLTFLoader, {
    gltf: {loadBuffers: true, loadFiles: true, loadImages: false}
  });
  const file = gltf.files?.[0];
  t.ok(file, 'returns a parallel resolved file entry');
  if (!file) {
    t.end();
    return;
  }

  t.equal(file.name, 'nested.glb', 'preserves the virtual package name');
  t.deepEqual(
    Array.from(new Uint8Array(file.arrayBuffer, file.byteOffset, file.byteLength)),
    [1, 2, 3, 4],
    'loads file bytes from its buffer view'
  );
  t.end();
});

test('GLTFLoader#load(binary)', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  t.ok(data.buffers, 'GLTFLoader without post-processing returned data.buffers');
  t.ok(data.images, 'GLTFLoader without post-processing returned data.images');
  t.ok(data.json, 'GLTFLoader without post-processing returned data.json');

  t.ok((data as any)._glb, 'GLTFLoader without post-processing returned data._glb');

  t.end();
});

test('GLTFLoader#load(text)', async t => {
  const data = await load(GLTF_JSON_URL, GLTFLoader, {gltf: {loadImages: false}});
  t.ok(data.json.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#Basis image options', t => {
  const loaderOptions: GLTFLoaderOptions = {
    core: {worker: true},
    basis: {
      supportedTextureFormats: ['bc3-rgba-unorm'],
      containerFormat: 'ktx2'
    }
  };

  const imageOptions = getGLTFImageOptions(loaderOptions, 'image/ktx2');

  t.deepEqual(
    imageOptions.basis,
    {
      supportedTextureFormats: ['bc3-rgba-unorm'],
      containerFormat: 'ktx2',
      format: {alpha: 'bc3', noAlpha: 'bc1'}
    },
    'selects a concrete format while preserving partial Basis options'
  );
  t.equal(imageOptions.core?.worker, true, 'preserves core options');
  t.equal(imageOptions.core?.mimeType, 'image/ktx2', 'sets the image MIME type');
  t.notOk(loaderOptions.basis?.format, 'does not mutate the supplied options');

  const explicitFormatOptions = getGLTFImageOptions({
    basis: {
      format: 'rgba32',
      module: 'encoder'
    }
  });

  t.deepEqual(
    explicitFormatOptions.basis,
    {
      format: 'rgba32',
      module: 'encoder'
    },
    'preserves an explicit Basis format and other options'
  );
  t.end();
});

test('GLTFLoader#load(3d tile GLB)', async t => {
  const result = await load(GLB_TILE_URL, [GLTFLoader, DracoLoader]);
  t.ok(result, 'Test that GLB from 3D tile parses');

  const result2 = await load(GLB_TILE_WITH_DRACO_URL, [GLTFLoader, DracoLoader, ImageBitmapLoader]);
  t.ok(result2, 'Parses Draco GLB with supplied DracoLoader');

  // TODO - prone to flakiness since we have async unregisterLoaders calls
  registerLoaders([DracoLoader, ImageBitmapLoader]);

  const gltf2 = await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader);
  t.ok(gltf2, 'Parses Draco GLB with default registered DracoLoader');

  t.end();
});

test('GLTFLoader#load(glTF v1)', async t => {
  await t.rejects(
    load(GLB_V1_TILE_CESIUM_AIR_URL, GLTFLoader, {gltf: {normalize: false}}),
    /glTF v1 is not supported/,
    'glTF v1 generates error message'
  );

  const gltf1 = await load(GLB_V1_TILE_CESIUM_AIR_URL, GLTFLoader, {gltf: {normalize: true}});
  t.ok(gltf1, 'glTF v1 was normalized without errors');

  t.end();
});

// Check load options

test('GLTFLoader#options+postProcessGLTF', async t => {
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const data = postProcessGLTF(gltfWithBuffers);
  const value = data.meshes[0].primitives[0].attributes.POSITION.value;
  t.ok(
    ArrayBuffer.isView(value),
    'GLTFLoader+postProcessGLTF() resolves accessor value as typed array'
  );
  t.equal(value.length, 6036, 'GLTFLoader+postProcessGLTF() resolves accessor value length');
  t.end();
});
