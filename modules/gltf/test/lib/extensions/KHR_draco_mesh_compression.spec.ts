// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decode} from '../../../src/lib/extensions/KHR_draco_mesh_compression';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

test('KHR_draco_mesh_compression forwards unique attribute ids and exact compressed bytes', async () => {
  const sourceBytes = new Uint8Array([90, 91, 92, 1, 2, 3, 93, 94]);
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_draco_mesh_compression'],
      extensionsRequired: ['KHR_draco_mesh_compression'],
      buffers: [{byteLength: sourceBytes.byteLength}],
      bufferViews: [{buffer: 0, byteOffset: 2, byteLength: 3}],
      accessors: [{componentType: 5126, count: 1, type: 'VEC2'}],
      meshes: [
        {
          primitives: [
            {
              attributes: {TEXCOORD_1: 0},
              extensions: {
                KHR_draco_mesh_compression: {
                  bufferView: 0,
                  attributes: {TEXCOORD_1: 7, _FEATURE_ID_0: 9}
                }
              }
            }
          ]
        }
      ]
    },
    buffers: [
      {
        arrayBuffer: sourceBytes.buffer,
        byteOffset: 1,
        byteLength: sourceBytes.byteLength - 1
      }
    ]
  };
  let parsedBytes: number[] = [];
  let parsedExtraAttributes: Record<string, number> | undefined;
  const context = {
    _parse: async (data: ArrayBuffer, _loader: unknown, options: any) => {
      parsedBytes = Array.from(new Uint8Array(data));
      parsedExtraAttributes = options.draco.extraAttributes;
      return {
        loader: 'draco',
        loaderData: {},
        topology: 'triangle-list',
        mode: 4,
        attributes: {
          TEXCOORD_1: {value: new Float32Array([0, 1]), size: 2},
          _FEATURE_ID_0: {value: new Uint16Array([4]), size: 1}
        },
        schema: {fields: []}
      };
    }
  };

  await decode(gltf, {gltf: {decompressMeshes: true}}, context as any);

  expect(parsedBytes).toEqual([1, 2, 3]);
  expect(parsedExtraAttributes).toEqual({TEXCOORD_1: 7, _FEATURE_ID_0: 9});
  expect(gltf.json.meshes?.[0].primitives[0].attributes).toEqual({
    TEXCOORD_1: expect.objectContaining({componentType: 5126, count: 1, type: 'VEC2'}),
    _FEATURE_ID_0: expect.objectContaining({componentType: 5123, count: 1, type: 'SCALAR'})
  });
  expect(gltf.json.extensionsUsed).toEqual([]);
  expect(gltf.json.extensionsRequired).toEqual([]);
});
