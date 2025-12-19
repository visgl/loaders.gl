/* eslint-disable camelcase */
/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateWriter} from 'test/common/conformance';

import {parse, encodeSync, encode, load} from '@loaders.gl/core';
import {GLTFLoader, GLTFWriter, GLTFScenegraph, postProcessGLTF} from '@loaders.gl/gltf';
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

  const gltf = await parse(arrayBuffer, GLTFLoader);
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

const gltfWithExtension = {
  json: {
    asset: {version: '1'},
    extensionsUsed: ['EXT_mesh_features'],
    meshes: [
      {
        primitives: [
          {
            attributes: {},
            extensions: {
              EXT_mesh_features: {
                featureIds: [
                  {
                    featureCount: 7,
                    propertyTable: 8,
                    data: [4, 4, 4, 3, 0, 1, 2]
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  }
};

const gltfJsonWithExtensionEncodedExpected = {
  asset: {
    version: '1'
  },
  extensionsUsed: ['EXT_mesh_features'],
  meshes: [
    {
      primitives: [
        {
          attributes: {
            _FEATURE_ID_0: 0
          },
          extensions: {
            EXT_mesh_features: {
              featureIds: [
                {
                  featureCount: 7,
                  propertyTable: 8,
                  attribute: 0
                }
              ]
            }
          }
        }
      ]
    }
  ],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: 0,
      byteLength: 28
    }
  ],
  accessors: [
    {
      bufferView: 0,
      type: 'SCALAR',
      componentType: 5125,
      count: 7,
      max: undefined,
      min: undefined
    }
  ],
  buffers: [
    {
      byteLength: 28
    }
  ]
};

const arrayBufferExpected = new Uint8Array([
  103, 108, 84, 70, 2, 0, 0, 0, 200, 1, 0, 0, 144, 1, 0, 0, 74, 83, 79, 78, 123, 34, 97, 115, 115,
  101, 116, 34, 58, 123, 34, 118, 101, 114, 115, 105, 111, 110, 34, 58, 34, 49, 34, 125, 44, 34,
  101, 120, 116, 101, 110, 115, 105, 111, 110, 115, 85, 115, 101, 100, 34, 58, 91, 34, 69, 88, 84,
  95, 109, 101, 115, 104, 95, 102, 101, 97, 116, 117, 114, 101, 115, 34, 93, 44, 34, 109, 101, 115,
  104, 101, 115, 34, 58, 91, 123, 34, 112, 114, 105, 109, 105, 116, 105, 118, 101, 115, 34, 58, 91,
  123, 34, 97, 116, 116, 114, 105, 98, 117, 116, 101, 115, 34, 58, 123, 34, 95, 70, 69, 65, 84, 85,
  82, 69, 95, 73, 68, 95, 48, 34, 58, 48, 125, 44, 34, 101, 120, 116, 101, 110, 115, 105, 111, 110,
  115, 34, 58, 123, 34, 69, 88, 84, 95, 109, 101, 115, 104, 95, 102, 101, 97, 116, 117, 114, 101,
  115, 34, 58, 123, 34, 102, 101, 97, 116, 117, 114, 101, 73, 100, 115, 34, 58, 91, 123, 34, 102,
  101, 97, 116, 117, 114, 101, 67, 111, 117, 110, 116, 34, 58, 55, 44, 34, 112, 114, 111, 112, 101,
  114, 116, 121, 84, 97, 98, 108, 101, 34, 58, 56, 44, 34, 97, 116, 116, 114, 105, 98, 117, 116,
  101, 34, 58, 48, 125, 93, 125, 125, 125, 93, 125, 93, 44, 34, 98, 117, 102, 102, 101, 114, 86,
  105, 101, 119, 115, 34, 58, 91, 123, 34, 98, 117, 102, 102, 101, 114, 34, 58, 48, 44, 34, 98, 121,
  116, 101, 79, 102, 102, 115, 101, 116, 34, 58, 48, 44, 34, 98, 121, 116, 101, 76, 101, 110, 103,
  116, 104, 34, 58, 50, 56, 125, 93, 44, 34, 97, 99, 99, 101, 115, 115, 111, 114, 115, 34, 58, 91,
  123, 34, 98, 117, 102, 102, 101, 114, 86, 105, 101, 119, 34, 58, 48, 44, 34, 116, 121, 112, 101,
  34, 58, 34, 83, 67, 65, 76, 65, 82, 34, 44, 34, 99, 111, 109, 112, 111, 110, 101, 110, 116, 84,
  121, 112, 101, 34, 58, 53, 49, 50, 53, 44, 34, 99, 111, 117, 110, 116, 34, 58, 55, 125, 93, 44,
  34, 98, 117, 102, 102, 101, 114, 115, 34, 58, 91, 123, 34, 98, 121, 116, 101, 76, 101, 110, 103,
  116, 104, 34, 58, 50, 56, 125, 93, 125, 32, 32, 28, 0, 0, 0, 66, 73, 78, 0, 4, 0, 0, 0, 4, 0, 0,
  0, 4, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0
]).buffer;

test('GLTFWriter#encode with extensions', async (t) => {
  const gltfBuilder = new GLTFScenegraph(gltfWithExtension);
  const arrayBuffer = encodeSync(gltfBuilder.gltf, GLTFWriter);
  t.deepEqual(gltfBuilder.gltf.json, gltfJsonWithExtensionEncodedExpected);
  t.deepEqual(arrayBuffer, arrayBufferExpected);

  t.end();
});

test('GLTFWriter#Should build a GLTF object with GLTFScenegraph builder functions', async (t) => {
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const inputData = postProcessGLTF(gltfWithBuffers);
  const gltfBuilder = new GLTFScenegraph();

  const meshIndex = gltfBuilder.addMesh({attributes: inputData.meshes[0].primitives[0].attributes});
  const nodeIndex = gltfBuilder.addNode({meshIndex});
  const sceneIndex = gltfBuilder.addScene({nodeIndices: [nodeIndex]});
  gltfBuilder.setDefaultScene(sceneIndex);
  if (inputData.images[0].bufferView?.data) {
    const imageBuffer = new ArrayBuffer(inputData.images[0].bufferView.data.byteLength);
    const imageBufferData = new Uint8Array(imageBuffer);
    imageBufferData.set(inputData.images[0].bufferView.data);
    const imageIndex = gltfBuilder.addImage(imageBuffer, 'image/jpeg');
    const textureIndex = gltfBuilder.addTexture({imageIndex});
    const pbrMaterialInfo = {
      pbrMetallicRoughness: {
        baseColorTexture: textureIndex
      }
    };
    gltfBuilder.addMaterial(pbrMaterialInfo);
  }

  gltfBuilder.createBinaryChunk();

  checkJson(t, gltfBuilder);

  const gltfBuffer = encodeSync(gltfBuilder.gltf, GLTFWriter);

  const gltf = await parse(gltfBuffer, GLTFLoader);

  checkJson(t, new GLTFScenegraph(gltf));
  t.end();
});

test('GLTFWriter#should write extra data to binary chunk', async (t) => {
  const gltfWithBuffers1 = await load(GLTF_BINARY_URL, GLTFLoader);
  const inputData = postProcessGLTF(gltfWithBuffers1);

  const gltfWithBuffers2 = await load(GLTF_BINARY_URL, GLTFLoader, {
    gltf: {decompressMeshes: false}
  });
  const gltfScenegraph = new GLTFScenegraph(gltfWithBuffers2);

  const meshIndex = gltfScenegraph.addMesh({
    attributes: inputData.meshes[0].primitives[0].attributes
  });

  t.equal(meshIndex, 1);

  gltfScenegraph.createBinaryChunk();

  t.ok(gltfScenegraph.gltf.json.meshes?.[0].primitives[0]);
  t.equal(
    gltfScenegraph.gltf.json.meshes?.[0].primitives[0].attributes.POSITION,
    1,
    'Input data should not be parsed'
  );

  // Encode to buffer
  const gltfBuffer = encodeSync(gltfScenegraph.gltf, GLTFWriter);

  // Now parse the generated buffer
  const gltfWithBuffers3 = await parse(gltfBuffer, GLTFLoader);
  const gltf = postProcessGLTF(gltfWithBuffers3);

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
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const inputData = postProcessGLTF(gltfWithBuffers);

  const data = await load(GLTF_BINARY_URL, GLTFLoader, {
    gltf: {decompressMeshes: false}
  });
  const gltfScenegraph = new GLTFScenegraph(data);

  gltfScenegraph.addMesh({
    attributes: {positions: inputData.meshes[0].primitives[0].attributes.POSITION}
  });
  gltfScenegraph.createBinaryChunk();
  const imageBuffer = await encode(inputData.images?.[0]?.image, ImageWriter);
  gltfScenegraph.addImage(imageBuffer, 'image/jpeg');
  gltfScenegraph.createBinaryChunk();
  t.ok(gltfScenegraph);

  const gltfBuffer = encodeSync(gltfScenegraph.gltf, GLTFWriter);

  const gltfWithBuffers2 = await parse(gltfBuffer, GLTFLoader);
  const gltf = postProcessGLTF(gltfWithBuffers2);

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

  t.equal(gltfBuilder.json.buffers[0].byteLength, 383372);

  t.ok(gltfBuilder.json.bufferViews);
  t.equal(gltfBuilder.json.bufferViews.length, 3);

  t.ok(gltfBuilder.json.images[0]);
  t.deepEqual(gltfBuilder.json.images[0], {bufferView: 2, mimeType: 'image/jpeg'});

  t.ok(gltfBuilder.json.meshes);
  t.deepEqual(gltfBuilder.json.meshes[0], {
    primitives: [{attributes: {POSITION: 0, TEXCOORD_0: 1}, mode: 4}]
  });
}
