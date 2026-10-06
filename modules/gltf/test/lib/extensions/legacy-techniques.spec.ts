// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decode} from '../../../src/lib/extensions/deprecated/KHR_techniques_webgl';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

test('legacy techniques resolve embedded shaders, uniforms and textures', async () => {
  const bytes = new TextEncoder().encode('void main() {}');
  const texture = {source: 0};
  const data = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_techniques_webgl'],
      extensions: {
        KHR_techniques_webgl: {
          shaders: [{bufferView: 0}],
          programs: [{vertexShader: 0, fragmentShader: 0}],
          techniques: [
            {program: 0, uniforms: {color: {value: [1, 0, 0]}, scale: {value: 2}, unset: {}}}
          ]
        }
      },
      bufferViews: [{buffer: 0, byteLength: bytes.byteLength}],
      textures: [texture],
      images: [{}],
      materials: [
        {extensions: {KHR_techniques_webgl: {technique: 0, values: {scale: 3, map: {index: 0}}}}},
        {}
      ]
    },
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
  } as unknown as GLTFWithBuffers;
  await decode(data);
  const material = data.json.materials![0] as NonNullable<
    GLTFWithBuffers['json']['materials']
  >[number] & {
    technique: {program: unknown; values: Record<string, unknown>};
  };
  expect(material.technique.program).toEqual({
    vertexShader: {bufferView: 0, code: 'void main() {}'},
    fragmentShader: {bufferView: 0, code: 'void main() {}'}
  });
  expect(material.technique.values).toEqual({
    color: [1, 0, 0],
    scale: 3,
    map: {index: 0, texture: expect.objectContaining({type: 'texture', index: 0, data: texture})}
  });
  expect(material.extensions).not.toHaveProperty('KHR_techniques_webgl');
  expect(data.json.extensions).not.toHaveProperty('KHR_techniques_webgl');
});

test('legacy techniques reject shaders without embedded code', async () => {
  const data = {
    json: {extensions: {KHR_techniques_webgl: {shaders: [{uri: 'shader.glsl'}]}}}
  } as unknown as GLTFWithBuffers;
  await expect(decode(data)).rejects.toThrow('KHR_techniques_webgl: no shader code');
});

test('legacy techniques accept omitted collections and uniforms', async () => {
  const data = {
    json: {
      extensions: {KHR_techniques_webgl: {}},
      materials: [{extensions: {KHR_techniques_webgl: {technique: 0}}}]
    }
  } as unknown as GLTFWithBuffers;
  await decode(data);
  expect(data.json.materials![0]).toMatchObject({technique: {values: {}}, extensions: {}});
});
