/* eslint-disable max-len, camelcase */
import test from 'tape-promise/tape';

import {parse, fetchFile} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import type {GLTFLoaderOptions} from '../../../src/gltf-loader';
import {decode as decodeTextureTransform} from '../../../src/lib/extensions/KHR_texture_transform';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/meshopt/BoxTextured_meshopt.glb';

test('GLTFLoader#KHR_texture_transform', async (t) => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const gltfWithBuffers = await parse(data, GLTFLoader);
  const gltf = postProcessGLTF(gltfWithBuffers);

  const primitive = gltf.meshes[0].primitives[0];
  const transformedTexCoord = primitive.material?.pbrMetallicRoughness?.baseColorTexture?.texCoord;
  t.equals(transformedTexCoord, 1, 'Moves transformed texture coordinates to TEXCOORD_1');
  t.equals(gltf.accessors[2].componentType, 5123, 'Preserves the shared source TEXCOORD_0');
  t.equals(primitive.attributes.TEXCOORD_0, gltf.accessors[2], 'Retains TEXCOORD_0');
  t.equals(primitive.attributes.TEXCOORD_1.componentType, 5126, 'Creates transformed float UVs');
  t.equals(primitive.attributes.TEXCOORD_1.value.constructor, Float32Array, 'Transforms UV data');
  t.end();
});

test('GLTFLoader#KHR_texture_transform preserves shared bufferView data', async (t) => {
  const interleavedVertexData = new Float32Array([
    // Vertex 0
    0, 0, 0, 0, 0, 1, 0, 0,
    // Vertex 1
    1, 0, 0, 0, 0, 1, 1, 0
  ]);
  const originalInterleavedCopy = Array.from(interleavedVertexData);
  const gltfWithBuffers: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_texture_transform'],
      buffers: [{byteLength: interleavedVertexData.byteLength}],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: interleavedVertexData.byteLength,
          byteStride: 32,
          target: 34962
        }
      ],
      accessors: [
        {bufferView: 0, byteOffset: 0, componentType: 5126, count: 2, type: 'VEC3'},
        {bufferView: 0, byteOffset: 12, componentType: 5126, count: 2, type: 'VEC3'},
        {bufferView: 0, byteOffset: 24, componentType: 5126, count: 2, type: 'VEC2'}
      ],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorTexture: {
              index: 0,
              extensions: {KHR_texture_transform: {offset: [0.1, 0.2], scale: [2, 3]}}
            }
          }
        }
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2},
              material: 0
            }
          ]
        }
      ]
    },
    buffers: [
      {
        arrayBuffer: interleavedVertexData.buffer,
        byteOffset: 0,
        byteLength: interleavedVertexData.byteLength
      }
    ]
  };

  await decodeTextureTransform(gltfWithBuffers, {gltf: {loadBuffers: true}} as GLTFLoaderOptions);

  const bufferViews = gltfWithBuffers.json.bufferViews || [];
  t.equals(bufferViews.length, 2, 'Creates a new bufferView for transformed texcoords');
  t.equals(
    bufferViews[0]?.byteStride,
    32,
    'Retains original interleaved bufferView byteStride for other attributes'
  );
  t.equals(
    bufferViews[0]?.byteLength,
    interleavedVertexData.byteLength,
    'Retains original interleaved bufferView byteLength for other attributes'
  );

  const texCoordAccessor = gltfWithBuffers.json.accessors?.[2];
  t.equals(texCoordAccessor?.bufferView, 0, 'Preserves the source texcoord bufferView');
  t.equals(texCoordAccessor?.byteOffset, 24, 'Preserves the source texcoord byte offset');
  t.equals(
    gltfWithBuffers.json.meshes?.[0].primitives[0].attributes.TEXCOORD_0,
    2,
    'Retains source texcoords'
  );
  t.equals(
    gltfWithBuffers.json.meshes?.[0].primitives[0].attributes.TEXCOORD_1,
    3,
    'Uses a separate transformed texcoord accessor'
  );

  const newTexCoordValues = Array.from(new Float32Array(gltfWithBuffers.buffers[1].arrayBuffer));
  const expectedTexCoordValues = [0.1, 0.2, 2.1, 0.2];
  const areTexCoordValuesWithinTolerance = expectedTexCoordValues.every((expectedValue, index) => {
    const actualValue = newTexCoordValues[index];
    return Number.isFinite(actualValue) && Math.abs(actualValue - expectedValue) < 1e-6;
  });
  t.ok(
    areTexCoordValuesWithinTolerance,
    'Applies texture transform to texcoords in isolated buffer'
  );

  const interleavedValuesAfterTransform = Array.from(
    new Float32Array(gltfWithBuffers.buffers[0].arrayBuffer)
  );
  t.deepEquals(
    interleavedValuesAfterTransform,
    originalInterleavedCopy,
    'Leaves shared interleaved buffer data unchanged'
  );

  t.end();
});
