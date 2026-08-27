// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
test('GLTFLoader#loader conformance', () => {
  validateLoader(GLTFLoader, 'GLTFLoader');
});
test('GLTFLoader#parseSync()', async () => {
  const response = await fetchFile(GLTF_JSON_URL);
  const data = await response.text();
  expect(
    () => parseSync(data, GLTFLoader),
    'GLTFLoader throws when synchronously parsing gltfs'
  ).toThrow();
});
test('GLTFLoader#load(binary)', async () => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  expect(data.json.asset, 'GLTFLoader returned parsed data').toBeTruthy();
});
test('GLTFLoader#parse() loads a draft glTF 2.1 thumbnail image', async () => {
  const gltf = await parse(
    JSON.stringify({
      asset: {version: '2.1', thumbnail: 0},
      images: [{uri: PNG_DATA_URL}]
    }),
    GLTFLoader
  );
  expect(gltf.images?.[0], 'loads an image referenced only by asset.thumbnail').toBeTruthy();
});
test('GLTFLoader#parse(v3) resolves explicit buffer chunk indices', async () => {
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
  expect(Array.from(firstBuffer), 'resolves buffer 0 from chunk 3').toEqual([5, 6, 7, 8]);
  expect(Array.from(secondBuffer), 'resolves buffer 1 from chunk 2').toEqual([1, 2, 3, 4]);
});
test('GLTFLoader#parse(v3) preserves legacy implicit buffer mapping', async () => {
  const data = createGLBV3({asset: {version: '2.1'}, buffers: [{byteLength: 4}]}, [
    new Uint8Array([1, 2, 3, 4])
  ]);
  const gltf = await parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}});
  const buffer = new Uint8Array(
    gltf.buffers[0].arrayBuffer,
    gltf.buffers[0].byteOffset,
    gltf.buffers[0].byteLength
  );
  expect(Array.from(buffer), 'maps the classic JSON-then-BIN layout').toEqual([1, 2, 3, 4]);
});
test('GLTFLoader#parse(v3) rejects implicit buffers outside the legacy layout', async () => {
  const data = createGLBV3(
    {asset: {version: '2.1'}, buffers: [{byteLength: 4}]},
    [new Uint8Array([1, 2, 3, 4])],
    [{type: 0x54534554, data: new Uint8Array([9, 10, 11, 12])}]
  );
  await expect(
    parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}}),
    'does not replace an unresolved buffer with zero-filled bytes'
  ).rejects.toThrow(/buffer 0 without a uri must define a valid GLB v3 chunk/);
});
test('GLTFLoader#parse(v3) rejects missing buffer chunks', async () => {
  const data = createGLBV3({
    asset: {version: '2.1'},
    buffers: [{byteLength: 4, chunk: 2}]
  });
  await expect(
    parse(data, GLTFLoader, {gltf: {loadBuffers: true, loadImages: false}}),
    'rejects a chunk index that does not select a BIN chunk'
  ).rejects.toThrow(/buffer 0 references missing GLB BIN chunk 2/);
});
test('GLTFLoader#parse(v3) loads embedded glTF 2.1 files', async () => {
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
  expect(file, 'returns a parallel resolved file entry').toBeTruthy();
  if (!file) {
    return;
  }
  expect(file.name, 'preserves the virtual package name').toBe('nested.glb');
  expect(
    Array.from(new Uint8Array(file.arrayBuffer, file.byteOffset, file.byteLength)),
    'loads file bytes from its buffer view'
  ).toEqual([1, 2, 3, 4]);
});
test('GLTFLoader#load(binary)', async () => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  expect(data.buffers, 'GLTFLoader without post-processing returned data.buffers').toBeTruthy();
  expect(data.images, 'GLTFLoader without post-processing returned data.images').toBeTruthy();
  expect(data.json, 'GLTFLoader without post-processing returned data.json').toBeTruthy();
  expect((data as any)._glb, 'GLTFLoader without post-processing returned data._glb').toBeTruthy();
});
test('GLTFLoader#load(text)', async () => {
  const data = await load(GLTF_JSON_URL, GLTFLoader, {gltf: {loadImages: false}});
  expect(data.json.asset, 'GLTFLoader returned parsed data').toBeTruthy();
});
test('GLTFLoader#Basis image options', () => {
  const loaderOptions: GLTFLoaderOptions = {
    core: {worker: true},
    basis: {
      supportedTextureFormats: ['bc3-rgba-unorm'],
      containerFormat: 'ktx2'
    }
  };
  const imageOptions = getGLTFImageOptions(loaderOptions, 'image/ktx2');
  expect(
    imageOptions.basis,
    'preserves automatic selection until the worker can inspect the source codec'
  ).toEqual({
    supportedTextureFormats: ['bc3-rgba-unorm'],
    containerFormat: 'ktx2',
    format: 'auto'
  });
  expect(imageOptions.core?.worker, 'preserves core options').toBe(true);
  expect(imageOptions.core?.mimeType, 'sets the image MIME type').toBe('image/ktx2');
  expect(loaderOptions.basis?.format, 'does not mutate the supplied options').toBeFalsy();
  const explicitFormatOptions = getGLTFImageOptions({
    basis: {
      format: 'rgba32'
    }
  });
  expect(explicitFormatOptions.basis, 'preserves an explicit Basis format').toEqual({
    format: 'rgba32'
  });
});
test('GLTFLoader#load(3d tile GLB)', async () => {
  const result = await load(GLB_TILE_URL, [GLTFLoader, DracoLoader]);
  expect(result, 'Test that GLB from 3D tile parses').toBeTruthy();
  const result2 = await load(GLB_TILE_WITH_DRACO_URL, [GLTFLoader, DracoLoader, ImageBitmapLoader]);
  expect(result2, 'Parses Draco GLB with supplied DracoLoader').toBeTruthy();
  // TODO - prone to flakiness since we have async unregisterLoaders calls
  registerLoaders([DracoLoader, ImageBitmapLoader]);
  const gltf2 = await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader);
  expect(gltf2, 'Parses Draco GLB with default registered DracoLoader').toBeTruthy();
});
test('GLTFLoader#load(glTF v1)', async () => {
  await expect(
    load(GLB_V1_TILE_CESIUM_AIR_URL, GLTFLoader, {gltf: {normalize: false}}),
    'glTF v1 generates error message'
  ).rejects.toThrow(/glTF v1 is not supported/);
  const gltf1 = await load(GLB_V1_TILE_CESIUM_AIR_URL, GLTFLoader, {gltf: {normalize: true}});
  expect(gltf1, 'glTF v1 was normalized without errors').toBeTruthy();
});
// Check load options
test('GLTFLoader#options+postProcessGLTF', async () => {
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const data = postProcessGLTF(gltfWithBuffers);
  const value = data.meshes[0].primitives[0].attributes.POSITION.value;
  expect(
    ArrayBuffer.isView(value),
    'GLTFLoader+postProcessGLTF() resolves accessor value as typed array'
  ).toBeTruthy();
  expect(value.length, 'GLTFLoader+postProcessGLTF() resolves accessor value length').toBe(6036);
});
