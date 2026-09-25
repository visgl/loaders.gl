// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decode} from '../../../src/lib/extensions/KHR_draco_mesh_compression';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {getTypedArrayForBufferView} from '../../../src/lib/gltf-utils/get-typed-array';

test.each([
  {name: 'whole buffer', source: [1, 2, 3], bufferByteOffset: 0, viewByteOffset: 0},
  {name: 'buffer subrange', source: [90, 91, 1, 2, 3, 92], bufferByteOffset: 1, viewByteOffset: 1}
])('KHR_draco_mesh_compression preserves a shared $name after transfer', async ({
  source,
  bufferByteOffset,
  viewByteOffset
}) => {
  const sourceBytes = new Uint8Array(source);
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_draco_mesh_compression'],
      buffers: [{byteLength: sourceBytes.byteLength - bufferByteOffset}],
      bufferViews: [{buffer: 0, byteOffset: viewByteOffset, byteLength: 3}],
      accessors: [{componentType: 5126, count: 1, type: 'VEC3'}],
      meshes: [
        {
          primitives: [0, 1].map(() => ({
            attributes: {POSITION: 0},
            extensions: {
              KHR_draco_mesh_compression: {bufferView: 0, attributes: {POSITION: 0}}
            }
          }))
        }
      ]
    },
    buffers: [
      {
        arrayBuffer: sourceBytes.buffer,
        byteOffset: bufferByteOffset,
        byteLength: sourceBytes.byteLength - bufferByteOffset
      }
    ]
  };
  const transferredBytes: number[][] = [];
  const context = {
    _parse: async (data: ArrayBuffer) => {
      // Use the same ownership transfer as a decoding worker, without loading a codec.
      const transferredData = structuredClone(data, {transfer: [data]});
      expect(data.byteLength).toBe(0);
      transferredBytes.push(Array.from(new Uint8Array(transferredData)));
      return {
        attributes: {POSITION: {value: new Float32Array([0, 1, 2]), size: 3}}
      };
    }
  };

  await decode(gltf, {gltf: {decompressMeshes: true}}, context as any);

  expect(transferredBytes).toEqual([
    [1, 2, 3],
    [1, 2, 3]
  ]);
  expect(Array.from(sourceBytes)).toEqual(source);
  expect(Array.from(getTypedArrayForBufferView(gltf.json, gltf.buffers, 0))).toEqual([1, 2, 3]);
  for (const primitive of gltf.json.meshes![0].primitives) {
    expect(primitive.attributes.POSITION).toEqual(
      expect.objectContaining({
        componentType: 5126,
        count: 1,
        type: 'VEC3'
      })
    );
    expect(primitive.extensions?.KHR_draco_mesh_compression).toBeUndefined();
  }
});

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
