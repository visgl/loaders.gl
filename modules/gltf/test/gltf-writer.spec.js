/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateWriter} from 'test/common/conformance';

import {parse, encodeSync, encode, isBrowser, load} from '@loaders.gl/core';
import {GLTFLoader, GLTFWriter, GLTFScenegraph} from '@loaders.gl/gltf';
import {ImageWriter} from '@loaders.gl/images';

import {loadI3STileContent} from '../../i3s/test/lib/utils/load-utils';

const EXTRA_DATA = {extraData: 1};
const APP_DATA = {vizData: 2};
const EXTENSION_DATA_1 = {extData: 3};
const EXTENSION_DATA_2 = {extData: 4};
const REQUIRED_EXTENSION_1 = 'UBER_extension_1';
const REQUIRED_EXTENSION_2 = 'UBER_extension_2';
const USED_EXTENSION_1 = 'UBER_extension_3';
const USED_EXTENSION_2 = 'UBER_extension_4';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';

test('GLTFWriter#loader conformance', t => {
  validateWriter(t, GLTFWriter, 'GLTFWriter');
  t.end();
});

test('GLTFWriter#encode', async t => {
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

test('GLTFWriter#Should build a GLTF object with GLTFScenegraph builder functions', async t => {
  const i3sContent = await loadI3STileContent();
  const gltfBuilder = new GLTFScenegraph();

  i3sContent.attributes.positions.value = new Float32Array(i3sContent.attributes.positions.value);

  const meshIndex = gltfBuilder.addMesh({
    positions: i3sContent.attributes.positions,
    normals: i3sContent.attributes.normals,
    colors: i3sContent.attributes.colors,
    texCoords: i3sContent.attributes.texCoords
  });
  const nodeIndex = gltfBuilder.addNode(meshIndex);
  const sceneIndex = gltfBuilder.addScene([nodeIndex]);
  gltfBuilder.setDefaultScene(sceneIndex);
  const imageBuffer = await encode(i3sContent.texture, ImageWriter);
  const imageIndex = gltfBuilder.addImage(imageBuffer, 'image/jpeg');
  const textureIndex = gltfBuilder.addTexture(imageIndex);
  const pbrMaterialInfo = {
    pbrMetallicRoughness: {
      baseColorTexture: textureIndex
    }
  };
  gltfBuilder.addMaterial(pbrMaterialInfo);
  gltfBuilder.createBinaryChunk();

  checkJson(t, gltfBuilder);

  const gltfBuffer = GLTFWriter.encodeSync(gltfBuilder.gltf);

  const gltf = await parse(gltfBuffer, GLTFLoader, {gltf: {postProcess: false}});

  checkJson(t, new GLTFScenegraph(gltf));
  t.end();
});

test('GLTFWriter#should write extra data to binary chunk', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {postProcess: false}});
  const gltfScenegraph = new GLTFScenegraph(data);

  const i3sContent = await loadI3STileContent();
  i3sContent.attributes.positions.value = new Float32Array(i3sContent.attributes.positions.value);
  const meshIndex = gltfScenegraph.addMesh({positions: i3sContent.attributes.positions});

  t.equal(meshIndex, 29);

  gltfScenegraph.createBinaryChunk();

  const gltfBuffer = GLTFWriter.encodeSync(gltfScenegraph.gltf);
  const gltf = await parse(gltfBuffer, GLTFLoader, {gltf: {postProcess: true}});

  t.ok(gltf);
  t.ok(gltf.meshes[29]);
  t.equal(
    gltf.meshes[29].primitives[0].attributes.POSITION.value.byteLength,
    i3sContent.attributes.positions.value.byteLength
  );
  t.end();
});

test('GLTFWriter#should write extra data to binary chunk twice', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader, {gltf: {postProcess: false}});
  const gltfScenegraph = new GLTFScenegraph(data);

  const i3sContent = await loadI3STileContent();
  i3sContent.attributes.positions.value = new Float32Array(i3sContent.attributes.positions.value);
  gltfScenegraph.addMesh({positions: i3sContent.attributes.positions});
  gltfScenegraph.createBinaryChunk();
  const imageBuffer = await encode(i3sContent.texture, ImageWriter);
  gltfScenegraph.addImage(imageBuffer, 'image/jpeg');
  gltfScenegraph.createBinaryChunk();
  t.ok(gltfScenegraph);

  const gltfBuffer = GLTFWriter.encodeSync(gltfScenegraph.gltf);
  const gltf = await parse(gltfBuffer, GLTFLoader, {gltf: {postProcess: true}});

  t.ok(gltf);
  t.ok(gltf.meshes[29]);
  t.equal(
    gltf.meshes[29].primitives[0].attributes.POSITION.value.byteLength,
    i3sContent.attributes.positions.value.byteLength
  );

  t.ok(gltf.images[0]);
  t.end();
});

function checkJson(t, gltfBuilder) {
  t.ok(gltfBuilder);
  t.ok(gltfBuilder.json);
  t.ok(gltfBuilder.json.accessors);
  t.equal(gltfBuilder.json.accessors.length, 4);

  t.ok(gltfBuilder.json.buffers[0]);
  if (isBrowser) {
    t.equal(gltfBuilder.json.buffers[0].byteLength, 953728);
  } else {
    t.equal(gltfBuilder.json.buffers[0].byteLength, 929292);
  }

  t.ok(gltfBuilder.json.bufferViews);
  t.equal(gltfBuilder.json.bufferViews.length, 5);

  t.ok(gltfBuilder.json.images[0]);
  t.deepEqual(gltfBuilder.json.images[0], {bufferView: 4, mimeType: 'image/jpeg'});

  t.ok(gltfBuilder.json.meshes);
  t.deepEqual(gltfBuilder.json.meshes[0], {
    primitives: [{attributes: {COLOR_0: 2, NORMAL: 1, POSITION: 0, TEXCOORD_0: 3}, mode: 4}]
  });
}
