/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateWriter} from 'test/common/conformance';

import {parse, encodeSync, encode, isBrowser, load} from '@loaders.gl/core';
import {GLTFLoader, GLTFWriter, GLTFScenegraph} from '@loaders.gl/gltf';
import {ImageWriter} from '@loaders.gl/images';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';

const EXTRA_DATA = {extraData: 1};
const APP_DATA = {vizData: 2};
const EXTENSION_DATA_1 = {extData: 3};
const EXTENSION_DATA_2 = {extData: 4};
const REQUIRED_EXTENSION_1 = 'UBER_extension_1';
const REQUIRED_EXTENSION_2 = 'UBER_extension_2';
const USED_EXTENSION_1 = 'UBER_extension_3';
const USED_EXTENSION_2 = 'UBER_extension_4';

test('GLTFWriter#loader conformance', (t) => {
  validateWriter(t, GLTFWriter, 'GLTFWriter');
  t.end();
});

test('GLTFWriter#encode', async (t) => {
  const gltfBuilder = new GLTFScenegraph();
  gltfBuilder.addApplicationData('viz', APP_DATA);
  gltfBuilder.addExtraData('test', EXTRA_DATA);

  gltfBuilder.registerUsedExtension(USED_EXTENSION_1);
  gltfBuilder.registerRequiredExtension(REQUIRED_EXTENSION_1);
  gltfBuilder.addExtension(USED_EXTENSION_2, EXTENSION_DATA_1);
  gltfBuilder.addRequiredExtension(REQUIRED_EXTENSION_2, EXTENSION_DATA_2);

  const arrayBuffer = encodeSync(gltfBuilder.gltf, GLTFWriter);

  const gltf = await parse(arrayBuffer, GLTFLoader, {gltf: {postProcess: false}});
  const gltfScenegraph = new GLTFScenegraph(gltf);

  const appData = gltfScenegraph.getApplicationData('viz');
  const extraData = gltfScenegraph.getExtraData('test');

  t.ok(appData, 'usedExtensions was found');
  t.ok(extraData, 'extraData was found');

  const usedExtensions = gltfScenegraph.getUsedExtensions();
  const requiredExtensions = gltfScenegraph.getRequiredExtensions();
  const extension1 = gltfScenegraph.getExtension(USED_EXTENSION_2);
  const extension2 = gltfScenegraph.getExtension(REQUIRED_EXTENSION_2);

  t.ok(usedExtensions, 'usedExtensions was found');
  t.ok(requiredExtensions, 'requiredExtensions was found');
  t.ok(extension1, 'extension1 was found');
  t.ok(extension2, 'extension2 was found');

  t.end();
});

test('GLTFWriter#Should build a GLTF object with GLTFScenegraph builder functions', async (t) => {
  const inputData = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {postProcess: true}});
  const gltfBuilder = new GLTFScenegraph();

  const meshIndex = gltfBuilder.addMesh({attributes: inputData.meshes[0].primitives[0].attributes});
  const nodeIndex = gltfBuilder.addNode({meshIndex});
  const sceneIndex = gltfBuilder.addScene({nodeIndices: [nodeIndex]});
  gltfBuilder.setDefaultScene(sceneIndex);
  const imageBuffer = await encode(inputData.images[0].image, ImageWriter);
  const imageIndex = gltfBuilder.addImage(imageBuffer, 'image/jpeg');
  const textureIndex = gltfBuilder.addTexture({imageIndex});
  const pbrMaterialInfo = {
    pbrMetallicRoughness: {
      baseColorTexture: textureIndex
    }
  };
  gltfBuilder.addMaterial(pbrMaterialInfo);
  gltfBuilder.createBinaryChunk();

  checkJson(t, gltfBuilder);

  const gltfBuffer = encodeSync(gltfBuilder.gltf, GLTFWriter);

  const gltf = await parse(gltfBuffer, GLTFLoader, {gltf: {postProcess: false}});

  checkJson(t, new GLTFScenegraph(gltf));
  t.end();
});

test('GLTFWriter#should write extra data to binary chunk', async (t) => {
  const inputData = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {postProcess: true}});
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {
    gltf: {postProcess: false, decompressMeshes: false}
  });
  const gltfScenegraph = new GLTFScenegraph(data);

  const meshIndex = gltfScenegraph.addMesh({
    attributes: inputData.meshes[0].primitives[0].attributes
  });

  t.equal(meshIndex, 1);

  gltfScenegraph.createBinaryChunk();

  t.ok(gltfScenegraph.gltf.json.meshes[0].primitives[0]);
  t.equal(
    gltfScenegraph.gltf.json.meshes[0].primitives[0].attributes.POSITION,
    1,
    'Input data should not be parsed'
  );

  const gltfBuffer = encodeSync(gltfScenegraph.gltf, GLTFWriter);
  const gltf = await parse(gltfBuffer, GLTFLoader, {gltf: {postProcess: true}});

  t.ok(gltf);
  t.ok(gltf.meshes[1]);
  t.equal(
    gltf.meshes[1].primitives[0].attributes.POSITION.value.byteLength,
    inputData.meshes[0].primitives[0].attributes.POSITION.value.byteLength
  );
  t.ok(gltf.meshes[0]);
  t.end();
});

test('GLTFWriter#should write extra data to binary chunk twice', async (t) => {
  const inputData = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {postProcess: true}});
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {
    gltf: {postProcess: false, decompressMeshes: false}
  });
  const gltfScenegraph = new GLTFScenegraph(data);

  gltfScenegraph.addMesh({
    attributes: {positions: inputData.meshes[0].primitives[0].attributes.POSITION}
  });
  gltfScenegraph.createBinaryChunk();
  const imageBuffer = await encode(inputData.images[0].image, ImageWriter);
  gltfScenegraph.addImage(imageBuffer, 'image/jpeg');
  gltfScenegraph.createBinaryChunk();
  t.ok(gltfScenegraph);

  const gltfBuffer = encodeSync(gltfScenegraph.gltf, GLTFWriter);
  const gltf = await parse(gltfBuffer, GLTFLoader, {gltf: {postProcess: true}});

  t.ok(gltf);
  t.ok(gltf.meshes[1]);
  t.equal(
    gltf.meshes[1].primitives[0].attributes.POSITION.value.byteLength,
    inputData.meshes[0].primitives[0].attributes.POSITION.value.byteLength
  );

  t.ok(gltf.images[2]);
  t.end();
});

function checkJson(t, gltfBuilder) {
  t.ok(gltfBuilder);
  t.ok(gltfBuilder.json);
  t.ok(gltfBuilder.json.accessors);
  t.equal(gltfBuilder.json.accessors.length, 2);

  t.ok(gltfBuilder.json.buffers[0]);
  if (isBrowser) {
    // TODO - something strange is going on here, we are getting variable lengths
    // t.equal(gltfBuilder.json.buffers[0].byteLength, 879252);
  } else {
    t.equal(gltfBuilder.json.buffers[0].byteLength, 374108);
  }

  t.ok(gltfBuilder.json.bufferViews);
  t.equal(gltfBuilder.json.bufferViews.length, 3);

  t.ok(gltfBuilder.json.images[0]);
  t.deepEqual(gltfBuilder.json.images[0], {bufferView: 2, mimeType: 'image/jpeg'});

  t.ok(gltfBuilder.json.meshes);
  t.deepEqual(gltfBuilder.json.meshes[0], {
    primitives: [{attributes: {POSITION: 0, TEXCOORD_0: 1}, mode: 4}]
  });
}
