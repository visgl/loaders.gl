/* eslint-disable max-len, camelcase */
import {expect, test} from 'vitest';

import {parse, fetchFile} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import type {GLTFLoaderOptions} from '../../../src/gltf-loader';
import {decode as decodeTextureTransform} from '../../../src/lib/extensions/KHR_texture_transform';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/meshopt/BoxTextured_meshopt.glb';

test('GLTFLoader#KHR_texture_transform', async () => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const gltfWithBuffers = await parse(data, GLTFLoader);
  const gltf = postProcessGLTF(gltfWithBuffers);

  const primitive = gltf.meshes[0].primitives[0];
  const transformedTexCoord = primitive.material?.pbrMetallicRoughness?.baseColorTexture?.texCoord;
  expect(transformedTexCoord).toBe(1);
  expect(gltf.accessors[2].componentType).toBe(5123);
  expect(primitive.attributes.TEXCOORD_0).toBe(gltf.accessors[2]);
  expect(primitive.attributes.TEXCOORD_1.componentType).toBe(5126);
  expect(primitive.attributes.TEXCOORD_1.value).toBeInstanceOf(Float32Array);
});

test('GLTFLoader#KHR_texture_transform preserves shared bufferView data', async () => {
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
  expect(bufferViews).toHaveLength(2);
  expect(bufferViews[0]?.byteStride).toBe(32);
  expect(bufferViews[0]?.byteLength).toBe(interleavedVertexData.byteLength);

  const texCoordAccessor = gltfWithBuffers.json.accessors?.[2];
  expect(texCoordAccessor?.bufferView).toBe(0);
  expect(texCoordAccessor?.byteOffset).toBe(24);
  expect(gltfWithBuffers.json.meshes?.[0].primitives[0].attributes.TEXCOORD_0).toBe(2);
  expect(gltfWithBuffers.json.meshes?.[0].primitives[0].attributes.TEXCOORD_1).toBe(3);

  const newTexCoordValues = Array.from(new Float32Array(gltfWithBuffers.buffers[1].arrayBuffer));
  const expectedTexCoordValues = [0.1, 0.2, 2.1, 0.2];
  const areTexCoordValuesWithinTolerance = expectedTexCoordValues.every((expectedValue, index) => {
    const actualValue = newTexCoordValues[index];
    return Number.isFinite(actualValue) && Math.abs(actualValue - expectedValue) < 1e-6;
  });
  expect(areTexCoordValuesWithinTolerance).toBe(true);

  const interleavedValuesAfterTransform = Array.from(
    new Float32Array(gltfWithBuffers.buffers[0].arrayBuffer)
  );
  expect(interleavedValuesAfterTransform).toEqual(originalInterleavedCopy);
});

test('GLTFLoader#KHR_texture_transform supports distinct transforms per texture', async () => {
  const texCoords = new Float32Array([0, 0, 1, 1]);
  const gltfWithBuffers: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_texture_transform', 'KHR_materials_clearcoat'],
      buffers: [{byteLength: texCoords.byteLength}],
      bufferViews: [{buffer: 0, byteLength: texCoords.byteLength}],
      accessors: [{bufferView: 0, componentType: 5126, count: 2, type: 'VEC2'}],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorTexture: {
              index: 0,
              extensions: {KHR_texture_transform: {offset: [0.25, 0.5]}}
            },
            metallicRoughnessTexture: {
              index: 1,
              extensions: {KHR_texture_transform: {scale: [2, 3]}}
            }
          },
          extensions: {
            KHR_materials_clearcoat: {
              clearcoatTexture: {
                index: 2,
                extensions: {KHR_texture_transform: {offset: [0.25, 0.5]}}
              }
            }
          }
        }
      ],
      meshes: [{primitives: [{attributes: {TEXCOORD_0: 0}, material: 0}]}]
    },
    buffers: [
      {
        arrayBuffer: texCoords.buffer,
        byteOffset: 0,
        byteLength: texCoords.byteLength
      }
    ]
  };

  await decodeTextureTransform(gltfWithBuffers, {gltf: {loadBuffers: true}} as GLTFLoaderOptions);

  const material = gltfWithBuffers.json.materials?.[0];
  const primitive = gltfWithBuffers.json.meshes?.[0].primitives[0];
  const clearcoatTexture = material?.extensions?.KHR_materials_clearcoat.clearcoatTexture;
  expect(material?.pbrMetallicRoughness?.baseColorTexture?.texCoord).toBe(1);
  expect(material?.pbrMetallicRoughness?.metallicRoughnessTexture?.texCoord).toBe(2);
  expect(clearcoatTexture.texCoord).toBe(1);
  expect(primitive?.attributes).toEqual({TEXCOORD_0: 0, TEXCOORD_1: 1, TEXCOORD_2: 2});
  expect(Array.from(new Float32Array(gltfWithBuffers.buffers[1].arrayBuffer))).toEqual([
    0.25, 0.5, 1.25, 1.5
  ]);
  expect(Array.from(new Float32Array(gltfWithBuffers.buffers[2].arrayBuffer))).toEqual([
    0, 0, 2, 3
  ]);
  expect(material?.pbrMetallicRoughness?.baseColorTexture?.extensions).toBeUndefined();
  expect(gltfWithBuffers.json.extensionsUsed).toEqual(['KHR_materials_clearcoat']);
  expect(gltfWithBuffers.json.extensionsRemoved).toEqual(['KHR_texture_transform']);
});
